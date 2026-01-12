require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkSchema() {
  console.log('🔍 Checking Turso schema...');
  console.log('📍 Turso URL:', process.env.TURSO_DATABASE_URL);

  // Get all tables
  const tables = await turso.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('\n📋 Tables in database:');
  tables.rows.forEach(row => console.log('  -', row.name));

  // Check IngredientMaster schema
  console.log('\n📊 IngredientMaster schema:');
  try {
    const schema = await turso.execute("PRAGMA table_info('IngredientMaster')");
    schema.rows.forEach(row => console.log(`  - ${row.name}: ${row.type}`));
  } catch (e) {
    console.log('  Table not found');
  }

  // Check IngredientTemplate schema
  console.log('\n📊 IngredientTemplate schema:');
  try {
    const schema = await turso.execute("PRAGMA table_info('IngredientTemplate')");
    schema.rows.forEach(row => console.log(`  - ${row.name}: ${row.type}`));
  } catch (e) {
    console.log('  Table not found');
  }

  // Check IngredientTemplateItem schema
  console.log('\n📊 IngredientTemplateItem schema:');
  try {
    const schema = await turso.execute("PRAGMA table_info('IngredientTemplateItem')");
    schema.rows.forEach(row => console.log(`  - ${row.name}: ${row.type}`));
  } catch (e) {
    console.log('  Table not found');
  }
}

checkSchema()
  .catch(console.error)
  .finally(() => process.exit(0));
