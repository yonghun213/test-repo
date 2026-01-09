require('dotenv').config();
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function safeJsonStringify(obj) {
  return JSON.stringify(
    obj,
    (_key, value) => {
      if (typeof value === 'bigint') return value.toString();
      return value;
    },
    2
  );
}

async function tryExecute(client, sql) {
  try {
    await client.execute(sql);
    return true;
  } catch (_e) {
    return false;
  }
}

function createDbClient(connection) {
  return createClient(connection);
}

function closeClient(client) {
  try {
    if (client && typeof client.close === 'function') client.close();
  } catch (_e) {
    // ignore
  }
}

function getArgMode() {
  const mode = (process.argv[2] || 'both').toLowerCase();
  if (!['local', 'turso', 'both'].includes(mode)) {
    throw new Error('Usage: node db-normalize.js [local|turso|both]');
  }
  return mode;
}

function isTruthy(v) {
  return v === '1' || v === 'true' || v === 'yes';
}

function shouldAllowEmptyBackup() {
  return isTruthy(process.env.ALLOW_EMPTY_BACKUP);
}

function isDryRun() {
  return isTruthy(process.env.DRY_RUN);
}

function getBackupFileOverride() {
  const p = process.env.BACKUP_FILE;
  return p && String(p).trim() ? String(p).trim() : null;
}

function shouldForceTursoMigrations() {
  return isTruthy(process.env.FORCE_TURSO_MIGRATIONS) || isTruthy(process.env.FORCE);
}

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const prev = i > 0 ? sql[i - 1] : '';

    if (ch === "'" && prev !== '\\' && !inDouble) inSingle = !inSingle;
    if (ch === '"' && prev !== '\\' && !inSingle) inDouble = !inDouble;

    if (ch === ';' && !inSingle && !inDouble) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
      continue;
    }

    current += ch;
  }

  const trimmed = current.trim();
  if (trimmed) statements.push(trimmed);
  return statements
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));
}

async function listTables(client) {
  const res = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  return res.rows.map((r) => String(r.name));
}

function isInternalTableName(name) {
  return name === '_PrismaMigrationsApplied' || name === '_prisma_migrations';
}

async function getTableColumns(client, table) {
  const res = await client.execute(`PRAGMA table_info("${table}")`);
  return new Set(res.rows.map((r) => String(r.name)));
}

async function countTableRows(client, table) {
  const res = await client.execute(`SELECT COUNT(*) as c FROM "${table}"`);
  const first = res.rows[0];
  return Number(first.c);
}

async function dumpTableRows(client, table) {
  const res = await client.execute(`SELECT * FROM "${table}"`);
  return res.rows;
}

async function backupDatabase(client, label, outDir) {
  const tables = (await listTables(client)).filter((t) => !isInternalTableName(t));

  if (tables.length === 0) {
    throw new Error(`No tables found to back up for ${label}. Check DB connection/path.`);
  }

  const data = {
    label,
    backedUpAt: new Date().toISOString(),
    tables: {},
  };

  const counts = {};
  for (const t of tables) {
    const rows = await dumpTableRows(client, t);
    data.tables[t] = rows;
    counts[t] = rows.length;
  }

  const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);

  const outPath = path.join(outDir, `${label}.json`);
  fs.writeFileSync(outPath, safeJsonStringify(data), 'utf8');

  return { outPath, counts, totalRows };
}

async function totalRowCount(client, tables) {
  let total = 0;
  for (const t of tables) {
    try {
      total += await countTableRows(client, t);
    } catch (_e) {
      // ignore
    }
  }
  return total;
}

async function pickBestBackupSource(connections) {
  let best = null;

  for (const connection of connections) {
    const client = createDbClient(connection);
    try {
      const tables = (await listTables(client)).filter((t) => !isInternalTableName(t));
      if (tables.length === 0) continue;
      const total = await totalRowCount(client, tables);
      const candidate = { connection, tables: tables.length, totalRows: total };
      if (!best) best = candidate;
      else if (candidate.totalRows > best.totalRows) best = candidate;
    } finally {
      closeClient(client);
    }
  }

  return best;
}

async function dropAllTables(client, tablesToDrop) {
  await tryExecute(client, 'PRAGMA foreign_keys=OFF');

  for (const t of tablesToDrop) {
    try {
      await client.execute(`DROP TABLE IF EXISTS "${t}"`);
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      throw new Error(`Failed to drop table ${t}: ${msg}`);
    }
  }
}

function rebuildLocalWithPrismaMigrations(localDbUrlForPrismaCli) {
  const env = { ...process.env, DATABASE_URL: localDbUrlForPrismaCli };
  execSync('npx prisma migrate deploy', {
    env,
    stdio: 'inherit',
  });
}

function rebuildTursoWithMigrationSql() {
  const env = { ...process.env };
  if (shouldForceTursoMigrations()) env.FORCE = '1';
  execSync('node apply-prisma-migrations-to-turso.js', {
    env,
    stdio: 'inherit',
  });
}

async function restoreDatabase(client, backupJson) {
  const backupTables = Object.keys(backupJson.tables || {});
  const existingTables = new Set(await listTables(client));
  const tables = backupTables.filter((t) => {
    if (!existingTables.has(t)) return false;
    if (isInternalTableName(t)) return false;
    return true;
  });

  await tryExecute(client, 'PRAGMA foreign_keys=OFF');

  for (const table of tables) {
    const rows = backupJson.tables[table] || [];
    if (!Array.isArray(rows) || rows.length === 0) continue;

    const existingCols = await getTableColumns(client, table);
    const columns = Object.keys(rows[0]).filter((c) => existingCols.has(c));
    if (columns.length === 0) continue;

    const colSql = columns.map((c) => `"${c}"`).join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    const insertSql = `INSERT INTO "${table}" (${colSql}) VALUES (${placeholders})`;

    for (const row of rows) {
      const args = columns.map((c) => {
        const v = row[c];
        return v === undefined ? null : v;
      });

      await client.execute({ sql: insertSql, args });
    }
  }

  await tryExecute(client, 'PRAGMA foreign_keys=ON');
}

async function verifyCounts(client, expectedCounts) {
  const existingTables = new Set(await listTables(client));
  const results = [];
  for (const [table, expected] of Object.entries(expectedCounts)) {
    if (isInternalTableName(table)) {
      results.push({ table, expected, actual: null, ok: true, skipped: true });
      continue;
    }
    if (!existingTables.has(table)) {
      results.push({ table, expected, actual: null, ok: true, skipped: true });
      continue;
    }
    try {
      const actual = await countTableRows(client, table);
      results.push({ table, expected, actual, ok: actual === expected });
    } catch (e) {
      results.push({ table, expected, actual: null, ok: false, error: String(e) });
    }
  }
  return results;
}

async function foreignKeyCheck(client) {
  try {
    const res = await client.execute('PRAGMA foreign_key_check');
    return Array.isArray(res.rows) ? res.rows : [];
  } catch (_e) {
    return [];
  }
}

function printVerification(label, rows) {
  const failed = rows.filter((r) => !r.ok);
  const skipped = rows.filter((r) => r.skipped);
  console.log(`\n🔎 Verification (${label})`);
  console.log(`   tables checked: ${rows.length}`);
  console.log(`   skipped (not in rebuilt schema): ${skipped.length}`);
  console.log(`   failed: ${failed.length}`);

  if (failed.length) {
    for (const f of failed.slice(0, 20)) {
      console.log(`   ❌ ${f.table}: expected=${f.expected} actual=${f.actual}`);
    }
  }
}

async function normalizeOneDatabase({
  label,
  backupConnection,
  targetConnection,
  backupDir,
  rebuild,
  cleanup,
  excludeTables = [],
}) {
  console.log(`\n============================`);
  console.log(`🚀 Normalizing ${label}`);
  console.log(`============================`);

  const backupFileOverride = getBackupFileOverride();
  let outPath;
  let counts;
  let totalRows;

  if (backupFileOverride) {
    outPath = backupFileOverride;
    const backupJson = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    const tableNames = Object.keys(backupJson.tables || {}).filter((t) => !isInternalTableName(t));
    counts = {};
    for (const t of tableNames) {
      const rows = backupJson.tables[t];
      counts[t] = Array.isArray(rows) ? rows.length : 0;
    }
    totalRows = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`✅ Using existing backup file: ${outPath}`);
    console.log(`📦 Backup totals: tables=${Object.keys(counts).length}, rows=${totalRows}`);
  } else {
    let backupClient = createDbClient(backupConnection);
    const res = await backupDatabase(backupClient, label, backupDir);
    outPath = res.outPath;
    counts = res.counts;
    totalRows = res.totalRows;
    console.log(`✅ Backup written: ${outPath}`);
    console.log(`📦 Backup totals: tables=${Object.keys(counts).length}, rows=${totalRows}`);
    closeClient(backupClient);
  }

  if (isDryRun()) {
    console.log(`\n🟡 DRY_RUN=1 enabled. Skipping drop/rebuild/restore for ${label}.`);
    console.log(`ℹ️  Backup kept at: ${outPath}`);
    return { ok: true, backupPath: outPath, dryRun: true };
  }

  if (totalRows === 0 && !shouldAllowEmptyBackup()) {
    console.log(
      `\n❌ Backup has 0 rows for ${label}. Refusing to rebuild/restore to avoid accidental data loss.`
    );
    console.log(
      `   If this is expected, re-run with ALLOW_EMPTY_BACKUP=1. Keeping backup file: ${outPath}`
    );
    return { ok: false, backupPath: outPath };
  }

  if (Object.keys(counts).length === 0) {
    console.log(`\n❌ Backup contains 0 tables for ${label}. Keeping backup file: ${outPath}`);
    return { ok: false, backupPath: outPath };
  }

  let client = createDbClient(targetConnection);

  const tables = await listTables(client);
  const toDrop = tables.filter((t) => !excludeTables.includes(t));
  console.log(`🧨 Dropping ${toDrop.length} tables...`);
  await dropAllTables(client, toDrop);

  console.log('🏗️  Rebuilding schema with Prisma migrations...');
  await rebuild();

  // IMPORTANT: reconnect after rebuild so sqlite_master reflects new schema
  closeClient(client);
  client = createDbClient(targetConnection);

  // Only restore tables that exist after rebuild (schema.prisma-driven)
  const rebuiltTables = await listTables(client);
  console.log(`📌 Rebuilt tables: ${rebuiltTables.length}`);

  if (rebuiltTables.length === 0) {
    console.log(`\n❌ Rebuilt schema has 0 tables for ${label}. Keeping backup file: ${outPath}`);
    return { ok: false, backupPath: outPath };
  }

  // Fail fast if any backed-up (non-internal) table is missing in rebuilt schema
  const backupJsonForCheck = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const backupTables = Object.keys(backupJsonForCheck.tables || {}).filter(
    (t) => !isInternalTableName(t)
  );
  const rebuiltSet = new Set(rebuiltTables);
  const missing = backupTables.filter((t) => !rebuiltSet.has(t));
  if (missing.length) {
    console.log(`\n❌ Missing ${missing.length} tables after rebuild for ${label}.`);
    console.log('   sample:', missing.slice(0, 20));
    console.log(`\nKeeping backup file: ${outPath}`);
    return { ok: false, backupPath: outPath };
  }

  console.log('📥 Restoring data...');
  const backupJson = backupJsonForCheck;
  await restoreDatabase(client, backupJson);

  const fkIssues = await foreignKeyCheck(client);
  if (fkIssues.length) {
    console.log(`\n❌ Foreign key check failed for ${label}: ${fkIssues.length} issue(s)`);
    console.log('   sample:', fkIssues.slice(0, 5));
    console.log(`\nKeeping backup file: ${outPath}`);
    return { ok: false, backupPath: outPath };
  }

  const verify = await verifyCounts(client, counts);
  printVerification(label, verify);

  const allOk = verify.every((r) => r.ok);
  if (!allOk) {
    console.log(`\n❌ Verification failed for ${label}. Keeping backup file: ${outPath}`);
    return { ok: false, backupPath: outPath };
  }

  // Never delete the explicitly provided BACKUP_FILE
  const canDeleteBackup = cleanup && !backupFileOverride;
  if (canDeleteBackup) {
    fs.unlinkSync(outPath);
    console.log(`🧹 Deleted backup: ${outPath}`);
  } else {
    console.log(`ℹ️  Cleanup disabled. Backup kept: ${outPath}`);
  }

  closeClient(client);

  return { ok: true, backupPath: outPath };
}

async function main() {
  const mode = getArgMode();
  // Default: keep backups for safety. Set CLEANUP=1 to delete after successful verification.
  const cleanup = isTruthy(process.env.CLEANUP) && !isTruthy(process.env.KEEP_BACKUP);

  // Local DB candidates:
  // - canonical: ./prisma/dev.db (recommended)
  // - legacy/misconfigured: ./prisma/prisma/dev.db (created when DATABASE_URL was set incorrectly)
  const localCanonicalClientUrl = process.env.LOCAL_DATABASE_URL_CLIENT || 'file:./prisma/dev.db';
  const localLegacyClientUrl = 'file:./prisma/prisma/dev.db';
  // Prisma uses schema-relative resolution; `file:./dev.db` => ./prisma/dev.db
  const localDbUrlPrisma = process.env.LOCAL_DATABASE_URL_PRISMA || 'file:./dev.db';

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, `tmp_db_backup_${ts}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const results = [];

  if (mode === 'local' || mode === 'both') {
    const bestLocal = await pickBestBackupSource([
      { url: localCanonicalClientUrl },
      { url: localLegacyClientUrl },
    ]);

    if (!bestLocal) {
      throw new Error('Could not find a local SQLite DB with tables to back up.');
    }

    console.log(
      `\n📌 Local backup source: ${bestLocal.connection.url} (tables=${bestLocal.tables}, totalRows=${bestLocal.totalRows})`
    );
    console.log(`📌 Local target (rebuilt/restored into): ${localCanonicalClientUrl}`);

    results.push(
      await normalizeOneDatabase({
        label: 'local',
        backupConnection: bestLocal.connection,
        targetConnection: { url: localCanonicalClientUrl },
        backupDir,
        rebuild: async () => rebuildLocalWithPrismaMigrations(localDbUrlPrisma),
        cleanup,
      })
    );
  }

  if (mode === 'turso' || mode === 'both') {
    if (!tursoUrl || !tursoAuthToken) {
      throw new Error(
        'Missing TURSO_DATABASE_URL/TURSO_AUTH_TOKEN. Refusing to touch Turso without explicit credentials.'
      );
    }

    results.push(
      await normalizeOneDatabase({
        label: 'turso',
        backupConnection: { url: tursoUrl, authToken: tursoAuthToken },
        targetConnection: { url: tursoUrl, authToken: tursoAuthToken },
        backupDir,
        rebuild: async () => rebuildTursoWithMigrationSql(),
        cleanup,
      })
    );
  }

  const allOk = results.every((r) => r.ok);
  if (allOk && cleanup) {
    try {
      fs.rmdirSync(backupDir);
    } catch (_) {
      // ignore if not empty
    }
  }

  if (!allOk) {
    process.exit(1);
  }

  console.log('\n✅ All done.');
}

main().catch((e) => {
  console.error('❌ db-normalize failed:', e);
  process.exit(1);
});
