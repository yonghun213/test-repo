require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to Turso database...');
  console.log('📍 Turso URL:', process.env.TURSO_DATABASE_URL);

  try {
    // Check current MenuManual schema
    console.log('\n📊 Current MenuManual schema:');
    const schema = await turso.execute("PRAGMA table_info('MenuManual')");
    const existingColumns = schema.rows.map(row => row.name);
    console.log('  Existing columns:', existingColumns.join(', '));

    // Add missing columns to MenuManual
    const columnsToAdd = [
      { name: 'sellingPrice', type: 'REAL', default: null },
      { name: 'imageUrl', type: 'TEXT', default: null },
      { name: 'cookingMethod', type: 'TEXT', default: null },
      { name: 'shelfLife', type: 'TEXT', default: null },
    ];

    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        console.log(`\n➕ Adding column: ${col.name}`);
        try {
          await turso.execute(`ALTER TABLE MenuManual ADD COLUMN ${col.name} ${col.type}`);
          console.log(`  ✅ Added ${col.name}`);
        } catch (e) {
          if (e.message.includes('duplicate column')) {
            console.log(`  ⚠️ Column ${col.name} already exists`);
          } else {
            console.error(`  ❌ Error adding ${col.name}:`, e.message);
          }
        }
      } else {
        console.log(`\n✅ Column ${col.name} already exists`);
      }
    }

    // Verify final schema
    console.log('\n📊 Updated MenuManual schema:');
    const updatedSchema = await turso.execute("PRAGMA table_info('MenuManual')");
    updatedSchema.rows.forEach(row => console.log(`  - ${row.name}: ${row.type}`));

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addMissingColumns()
  .catch(console.error)
  .finally(() => process.exit(0));
