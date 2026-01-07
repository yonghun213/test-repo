// Recreate ManualIngredient table with Prisma schema
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function recreateManualIngredient() {
  console.log('🔧 Recreating ManualIngredient table...\n');

  try {
    // 1. Drop old table
    console.log('1️⃣ Dropping old ManualIngredient table...');
    await turso.execute(`DROP TABLE IF EXISTS ManualIngredient;`);
    console.log('   ✅ Old table dropped\n');

    // 2. Create new table matching Prisma schema
    console.log('2️⃣ Creating new ManualIngredient table...');
    await turso.execute(`
      CREATE TABLE ManualIngredient (
        id TEXT PRIMARY KEY,
        manualId TEXT NOT NULL,
        ingredientId TEXT,
        name TEXT NOT NULL,
        koreanName TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        section TEXT DEFAULT 'MAIN',
        sortOrder INTEGER DEFAULT 0,
        notes TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (manualId) REFERENCES MenuManual(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredientId) REFERENCES IngredientMaster(id) ON DELETE SET NULL
      );
    `);
    console.log('   ✅ New table created\n');

    console.log('🎉 ManualIngredient table recreated successfully!');
    
    // Verify
    const result = await turso.execute(`PRAGMA table_info(ManualIngredient);`);
    console.log('\n📋 ManualIngredient columns:');
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

recreateManualIngredient();
