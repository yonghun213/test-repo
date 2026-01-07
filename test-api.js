// Test manuals API endpoint directly
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function testAPI() {
  console.log('🧪 Testing manual data retrieval...\n');

  try {
    // 1. Check raw data in DB
    console.log('1️⃣ Checking raw database data...');
    const manuals = await turso.execute('SELECT * FROM MenuManual;');
    console.log(`   Found ${manuals.rows.length} manuals in DB`);
    
    if (manuals.rows.length > 0) {
      console.log('\n   Sample manual:');
      const sample = manuals.rows[0];
      console.log(`   - ID: ${sample.id}`);
      console.log(`   - Name: ${sample.name}`);
      console.log(`   - Korean Name: ${sample.koreanName}`);
      console.log(`   - Group ID: ${sample.groupId}`);
      console.log(`   - Created At: ${sample.createdAt}`);
    }

    // 2. Check if there's a group
    console.log('\n2️⃣ Checking manual groups...');
    const groups = await turso.execute('SELECT * FROM ManualGroup;');
    console.log(`   Found ${groups.rows.length} groups in DB`);
    
    if (groups.rows.length > 0) {
      groups.rows.forEach((group, i) => {
        console.log(`   ${i + 1}. ${group.name} (ID: ${group.id}, Active: ${group.isActive})`);
      });
    }

    // 3. Check ingredients
    console.log('\n3️⃣ Checking manual ingredients...');
    const ingredients = await turso.execute('SELECT * FROM ManualIngredient;');
    console.log(`   Found ${ingredients.rows.length} ingredients in DB`);

    // 4. Test if Prisma schema matches
    console.log('\n4️⃣ Checking table schema...');
    const schema = await turso.execute('PRAGMA table_info(MenuManual);');
    console.log('   MenuManual columns:');
    schema.rows.forEach(col => {
      console.log(`   - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''}`);
    });

    // 5. Potential issue: Check createdAt and updatedAt format
    console.log('\n5️⃣ Checking datetime formats...');
    if (manuals.rows.length > 0) {
      const manual = manuals.rows[0];
      console.log(`   createdAt: ${manual.createdAt} (type: ${typeof manual.createdAt})`);
      console.log(`   updatedAt: ${manual.updatedAt} (type: ${typeof manual.updatedAt})`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    turso.close();
  }
}

testAPI();
