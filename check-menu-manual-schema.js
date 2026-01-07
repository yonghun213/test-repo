// Check MenuManual table schema in Turso DB
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkSchema() {
  console.log('🔍 Checking MenuManual table schema...\n');

  try {
    // Get table info
    const result = await turso.execute(`PRAGMA table_info(MenuManual);`);
    
    console.log('📋 Current MenuManual columns:');
    console.log('================================================');
    result.rows.forEach(row => {
      console.log(`  ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : 'NULL'} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`);
    });
    console.log('================================================\n');
    
    // Check if 'name' column exists
    const hasName = result.rows.some(row => row.name === 'name');
    
    if (hasName) {
      console.log('✅ "name" column exists');
    } else {
      console.log('❌ "name" column is MISSING!');
      console.log('   This is the cause of the error.');
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    turso.close();
  }
}

checkSchema();
