// Check if manuals are saved in Turso DB
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkManuals() {
  console.log('🔍 Checking saved manuals in Turso DB...\n');

  try {
    // Count total manuals
    const countResult = await turso.execute('SELECT COUNT(*) as total FROM MenuManual;');
    console.log(`📊 Total manuals: ${countResult.rows[0].total}\n`);

    // Get all manuals
    const result = await turso.execute('SELECT * FROM MenuManual ORDER BY createdAt DESC LIMIT 10;');
    
    if (result.rows.length === 0) {
      console.log('❌ No manuals found in database!');
      console.log('   This means the manual was not actually saved to Turso DB.');
    } else {
      console.log('✅ Found manuals:');
      console.log('='.repeat(100));
      result.rows.forEach((row, i) => {
        console.log(`\n${i + 1}. Manual:`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Name: ${row.name}`);
        console.log(`   Korean Name: ${row.koreanName}`);
        console.log(`   Group ID: ${row.groupId || 'null'}`);
        console.log(`   Selling Price: ${row.sellingPrice}`);
        console.log(`   Created At: ${row.createdAt}`);
      });
      console.log('\n' + '='.repeat(100));
    }

    // Check ingredients
    const ingredientsResult = await turso.execute('SELECT COUNT(*) as total FROM ManualIngredient;');
    console.log(`\n📦 Total manual ingredients: ${ingredientsResult.rows[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    turso.close();
  }
}

checkManuals();
