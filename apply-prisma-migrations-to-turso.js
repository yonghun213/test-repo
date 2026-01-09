require('dotenv').config();
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function shouldIgnoreErrorMessage(message) {
  const m = String(message || '').toLowerCase();
  return (
    m.includes('already exists') ||
    m.includes('duplicate column') ||
    m.includes('already has column') ||
    m.includes('duplicate') ||
    m.includes('unique constraint failed')
  );
}

function isTruthy(v) {
  return v === '1' || v === 'true' || v === 'yes';
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
  return statements;
}

async function ensureTrackingTable(client) {
  await client.execute(
    `CREATE TABLE IF NOT EXISTS "_PrismaMigrationsApplied" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "appliedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
}

async function getAppliedMigrationIds(client) {
  try {
    const res = await client.execute(
      `SELECT "id" FROM "_PrismaMigrationsApplied" ORDER BY "appliedAt" ASC`
    );
    return new Set(res.rows.map((r) => String(r.id)));
  } catch (e) {
    return new Set();
  }
}

async function markMigrationApplied(client, id) {
  await client.execute({
    sql: `INSERT OR IGNORE INTO "_PrismaMigrationsApplied" ("id") VALUES (?)`,
    args: [id],
  });
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error(
      'Missing Turso credentials. Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (or DATABASE_URL + DATABASE_AUTH_TOKEN).'
    );
  }

  const dryRun = isTruthy(process.env.DRY_RUN);
  const force = isTruthy(process.env.FORCE);

  const client = createClient({ url, authToken });
  const migrationsDir = path.join(__dirname, 'prisma', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  console.log('🔗 Connecting to Turso...');
  console.log(`   URL: ${String(url).slice(0, 48)}...`);
  console.log(`   Mode: ${dryRun ? 'DRY_RUN' : 'APPLY'}${force ? ' (FORCE)' : ''}`);

  await ensureTrackingTable(client);
  const applied = await getAppliedMigrationIds(client);

  const entries = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  if (entries.length === 0) {
    console.log('No migrations found.');
    return;
  }

  for (const migrationId of entries) {
    const migrationFile = path.join(migrationsDir, migrationId, 'migration.sql');
    if (!fs.existsSync(migrationFile)) continue;

    if (!force && applied.has(migrationId)) {
      console.log(`⏭️  ${migrationId} (already recorded)`);
      continue;
    }

    const sql = fs.readFileSync(migrationFile, 'utf8');
    const statements = splitSqlStatements(sql);

    console.log(`\n📦 Applying ${migrationId} (${statements.length} statements)`);

    if (dryRun) {
      console.log(`   (dry-run) would apply: ${migrationFile}`);
      continue;
    }

    for (const stmt of statements) {
      // Prisma migration.sql frequently prefixes statements with "-- ..." lines.
      // If we skip statements that *start* with "--", we'd accidentally skip CREATE TABLE.
      const withoutLineComments = String(stmt)
        .split('\n')
        .filter((l) => !l.trim().startsWith('--'))
        .join('\n');

      const trimmed = withoutLineComments.trim();
      if (!trimmed) continue;

      try {
        await client.execute(trimmed);
      } catch (e) {
        const message = e && e.message ? e.message : String(e);
        if (shouldIgnoreErrorMessage(message)) {
          console.log(`   ⏭️  ignored: ${message}`);
          continue;
        }
        console.error(`   ❌ failed statement:\n${trimmed}\n`);
        throw e;
      }
    }

    await markMigrationApplied(client, migrationId);
    console.log(`✅ Applied ${migrationId}`);
  }

  console.log('\n✅ Done.');
}

main().catch((e) => {
  console.error('❌ Migration apply failed:', e);
  process.exit(1);
});
