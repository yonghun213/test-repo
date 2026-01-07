// Fix MenuManual table - add missing columns
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function fixMenuManualTable() {
  console.log('🔧 Fixing MenuManual table...\n');

  try {
    // Add missing columns based on Prisma schema
    const alterCommands = [
      `ALTER TABLE MenuManual ADD COLUMN name TEXT;`,
      `ALTER TABLE MenuManual ADD COLUMN koreanName TEXT;`,
      `ALTER TABLE MenuManual ADD COLUMN imageUrl TEXT;`,
      `ALTER TABLE MenuManual ADD COLUMN shelfLife TEXT;`,
      `ALTER TABLE MenuManual ADD COLUMN yield REAL;`,
      `ALTER TABLE MenuManual ADD COLUMN yieldUnit TEXT;`,
      `ALTER TABLE MenuManual ADD COLUMN sellingPrice REAL;`,
      `ALTER TABLE MenuManual ADD COLUMN notes TEXT;`,
      `ALTER TABLE MenuManual ADD COLUMN cookingMethod TEXT;`,
      `ALTER TABLE MenuManual ADD COLUMN isActive INTEGER DEFAULT 1;`,
      `ALTER TABLE MenuManual ADD COLUMN groupId TEXT;`,
    ];

    for (const cmd of alterCommands) {
      try {
        console.log(`Executing: ${cmd}`);
        await turso.execute(cmd);
        console.log('  ✅ Success');
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log('  ⏭️  Column already exists');
        } else {
          console.log('  ❌ Error:', error.message);
        }
      }
    }

    console.log('\n🎉 MenuManual table update complete!');
    
    // Verify
    const result = await turso.execute(`PRAGMA table_info(MenuManual);`);
    console.log('\n📋 Updated MenuManual columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    turso.close();
  }
}

fixMenuManualTable();
