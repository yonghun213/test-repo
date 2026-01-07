// Recreate MenuManual table with clean Prisma-compatible schema
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function recreateTable() {
  console.log('🔧 Recreating MenuManual table...\n');

  try {
    // 1. Drop old table
    console.log('1️⃣ Dropping old MenuManual table...');
    await turso.execute(`DROP TABLE IF EXISTS MenuManual;`);
    console.log('   ✅ Old table dropped\n');

    // 2. Create new table matching Prisma schema
    console.log('2️⃣ Creating new MenuManual table...');
    await turso.execute(`
      CREATE TABLE MenuManual (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        koreanName TEXT,
        imageUrl TEXT,
        shelfLife TEXT,
        yield REAL,
        yieldUnit TEXT,
        sellingPrice REAL,
        notes TEXT,
        cookingMethod TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        groupId TEXT
      );
    `);
    console.log('   ✅ New table created\n');

    console.log('🎉 MenuManual table recreated successfully!');
    
    // Verify
    const result = await turso.execute(`PRAGMA table_info(MenuManual);`);
    console.log('\n📋 MenuManual columns:');
    result.rows.forEach(row => {
      const notNull = row.notnull ? 'NOT NULL' : 'NULL';
      const defaultVal = row.dflt_value ? ` DEFAULT ${row.dflt_value}` : '';
      console.log(`  - ${row.name} (${row.type}) ${notNull}${defaultVal}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    turso.close();
  }
}

recreateTable();
