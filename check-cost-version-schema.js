const { createClient } = require('@libsql/client');

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://database-la-vercel-icfg-mrja4qo0a3evj1oadmz7gjh9.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function checkCostVersionSchema() {
  try {
    console.log('🔍 Checking ManualCostVersion table schema...\n');
    
    // Check if table exists
    const tableCheck = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='ManualCostVersion'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ ManualCostVersion table does NOT exist!');
      console.log('Creating table...\n');
      
      // Create table with all required columns
      await turso.execute(`
        CREATE TABLE ManualCostVersion (
          id TEXT PRIMARY KEY,
          manualId TEXT NOT NULL,
          templateId TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          totalCost REAL DEFAULT 0,
          currency TEXT DEFAULT 'CAD',
          costPerUnit REAL,
          isActive INTEGER DEFAULT 1,
          calculatedAt TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (manualId) REFERENCES MenuManual(id) ON DELETE CASCADE,
          FOREIGN KEY (templateId) REFERENCES IngredientTemplate(id) ON DELETE CASCADE,
          UNIQUE(manualId, templateId)
        )
      `);
      
      console.log('✅ ManualCostVersion table created successfully!');
    } else {
      console.log('✅ ManualCostVersion table exists');
      
      // Get table schema
      const schema = await turso.execute('PRAGMA table_info(ManualCostVersion)');
      
      console.log('\nCurrent columns:');
      schema.rows.forEach(col => {
        console.log(`   - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''}`);
      });
      
      // Check if name column exists
      const hasNameColumn = schema.rows.some(col => col.name === 'name');
      
      if (!hasNameColumn) {
        console.log('\n❌ Missing "name" column! Adding it...');
        await turso.execute('ALTER TABLE ManualCostVersion ADD COLUMN name TEXT');
        
        // Update existing rows with a default name
        await turso.execute(`
          UPDATE ManualCostVersion 
          SET name = 'Cost Version ' || substr(id, 1, 8)
          WHERE name IS NULL
        `);
        
        console.log('✅ "name" column added successfully!');
      } else {
        console.log('\n✅ "name" column exists');
      }
    }
    
    // Check ManualCostLine table too
    console.log('\n🔍 Checking ManualCostLine table...');
    const costLineCheck = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='ManualCostLine'
    `);
    
    if (costLineCheck.rows.length === 0) {
      console.log('❌ ManualCostLine table does NOT exist! Creating...');
      
      await turso.execute(`
        CREATE TABLE ManualCostLine (
          id TEXT PRIMARY KEY,
          costVersionId TEXT NOT NULL,
          ingredientId TEXT NOT NULL,
          unitPrice REAL NOT NULL,
          quantity REAL NOT NULL,
          unit TEXT NOT NULL,
          yieldRate REAL DEFAULT 100,
          lineCost REAL NOT NULL,
          notes TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (costVersionId) REFERENCES ManualCostVersion(id) ON DELETE CASCADE,
          FOREIGN KEY (ingredientId) REFERENCES ManualIngredient(id) ON DELETE CASCADE
        )
      `);
      
      console.log('✅ ManualCostLine table created!');
    } else {
      console.log('✅ ManualCostLine table exists');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    turso.close();
  }
}

checkCostVersionSchema();
