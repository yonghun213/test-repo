require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const { createClient } = require('@libsql/client');
const path = require('path');

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function cuid() {
  return 'c' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function seedPricingData() {
  console.log('🌱 Starting pricing data seed to Turso...');
  console.log('📍 Turso URL:', process.env.TURSO_DATABASE_URL);

  const now = new Date().toISOString();

  // Read Excel file
  const excelPath = path.join(
    'C:/Users/kunbb/OneDrive/기본/바탕 화면/데이터분석 자동화/Master Data File/합쳐진파일/test-repo',
    '원가파일-20250506 (1).xlsx'
  );

  console.log('📖 Reading Excel file:', excelPath);
  const workbook = XLSX.readFile(excelPath);
  const worksheet = workbook.Sheets['Master Price page'];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Parse valid rows (skip header rows)
  const ingredients = [];
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (row[1] && typeof row[1] === 'number') {
      ingredients.push({
        no: row[1],
        category: row[2] || 'Other',
        koreanName: String(row[3] || '').trim(),
        masterDetail: String(row[4] || '').trim(),
        englishName: String(row[5] || '').trim(),
        quantity: parseFloat(row[6]) || 0,
        unit: String(row[7] || '').trim(),
        yieldRate: parseFloat(row[8]) || 1,
        cadPrice: parseFloat(row[9]) || 0,
      });
    }
  }

  console.log(`📦 Found ${ingredients.length} ingredients to seed`);

  // Delete existing data for clean seed
  console.log('🗑️ Cleaning existing data...');
  try {
    await turso.execute('DELETE FROM "IngredientTemplateItem"');
    await turso.execute('DELETE FROM "IngredientTemplate" WHERE name IN ("Canada", "Mexico", "Colombia", "Central America")');
    // Don't delete all IngredientMaster - just update/insert
    console.log('✅ Cleaned existing template items');
  } catch (error) {
    console.log('⚠️ Clean error:', error.message);
  }

  // Create IngredientMaster records
  // Turso schema: id, name, nameKo, kind, category, baseUnit, yieldRate, description, isActive, createdAt, updatedAt
  console.log('📝 Creating IngredientMaster records...');
  const ingredientMasterMap = new Map(); // koreanName -> id

  for (const ing of ingredients) {
    const id = cuid();
    try {
      await turso.execute({
        sql: `INSERT INTO "IngredientMaster" (id, name, nameKo, kind, category, baseUnit, yieldRate, isActive, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          ing.englishName || ing.koreanName, // name (English)
          ing.koreanName,                     // nameKo (Korean)
          'RAW',                              // kind
          ing.category,
          ing.unit || 'g',                    // baseUnit
          ing.yieldRate * 100,                // yieldRate (percentage)
          1,                                  // isActive
          now,
          now
        ]
      });
      ingredientMasterMap.set(ing.koreanName, { id, ...ing });
    } catch (error) {
      console.error(`❌ Error creating ingredient ${ing.koreanName}:`, error.message);
    }
  }
  console.log(`✅ Created ${ingredientMasterMap.size} IngredientMaster records`);

  // Create or get countries first
  console.log('📝 Creating/Getting Country records...');
  const countryMap = new Map(); // code -> id
  
  const countries = [
    { code: 'CA', name: 'Canada', currency: 'CAD', timezone: 'America/Toronto' },
    { code: 'MX', name: 'Mexico', currency: 'MXN', timezone: 'America/Mexico_City' },
    { code: 'CO', name: 'Colombia', currency: 'COP', timezone: 'America/Bogota' },
    { code: 'US', name: 'Central America', currency: 'USD', timezone: 'America/Guatemala' },
  ];

  for (const country of countries) {
    try {
      // Check if country exists
      const existing = await turso.execute({
        sql: 'SELECT id FROM "Country" WHERE code = ?',
        args: [country.code]
      });
      
      if (existing.rows.length > 0) {
        countryMap.set(country.code, existing.rows[0].id);
        console.log(`  ✓ Found existing country: ${country.name}`);
      } else {
        const id = cuid();
        await turso.execute({
          sql: `INSERT INTO "Country" (id, code, name, currency, timezone, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [id, country.code, country.name, country.currency, country.timezone, now]
        });
        countryMap.set(country.code, id);
        console.log(`  ✓ Created country: ${country.name}`);
      }
    } catch (error) {
      console.error(`❌ Error with country ${country.name}:`, error.message);
    }
  }

  // Create templates
  // Turso schema: id, name, countryId, description, isActive, createdAt, updatedAt
  const templates = [
    { code: 'CA', name: 'Canada', currency: 'CAD', hasPrice: true },
    { code: 'MX', name: 'Mexico', currency: 'MXN', hasPrice: false },
    { code: 'CO', name: 'Colombia', currency: 'COP', hasPrice: false },
    { code: 'US', name: 'Central America', currency: 'USD', hasPrice: false },
  ];

  const templateMap = new Map(); // code -> id

  for (const tmpl of templates) {
    const countryId = countryMap.get(tmpl.code);
    if (!countryId) {
      console.error(`❌ No country found for ${tmpl.code}, skipping template`);
      continue;
    }
    
    const id = cuid();
    try {
      await turso.execute({
        sql: `INSERT INTO "IngredientTemplate" (id, name, countryId, description, isActive, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          tmpl.name,
          countryId,
          `${tmpl.name} pricing template`,
          1,
          now,
          now
        ]
      });
      templateMap.set(tmpl.code, { id, ...tmpl });
      console.log(`✅ Created template: ${tmpl.name}`);
    } catch (error) {
      console.error(`❌ Error creating template ${tmpl.name}:`, error.message);
    }
  }

  // Create IngredientTemplateItem records
  // Turso schema: id, templateId, ingredientId, price, currency, packageSize, packageUnit, normalizedUnitCost, isActive, yieldRate, createdAt, updatedAt
  console.log('📝 Creating IngredientTemplateItem records...');
  let itemsCreated = 0;

  for (const [code, tmplData] of templateMap) {
    const tmpl = templates.find(t => t.code === code);
    
    for (const [koreanName, ingData] of ingredientMasterMap) {
      const itemId = cuid();
      const price = tmpl.hasPrice ? ingData.cadPrice : 0;
      
      try {
        await turso.execute({
          sql: `INSERT INTO "IngredientTemplateItem" (id, templateId, ingredientId, price, currency, packageSize, packageUnit, isActive, createdAt, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            itemId,
            tmplData.id,
            ingData.id,
            price,
            tmpl.currency,
            ingData.quantity || 1,            // packageSize
            ingData.unit || 'g',              // packageUnit
            1,                                // isActive
            now,
            now
          ]
        });
        itemsCreated++;
      } catch (error) {
        console.error(`❌ Error creating template item for ${koreanName}:`, error.message);
      }
    }
    console.log(`✅ Created ${ingredientMasterMap.size} items for ${tmpl.name} template`);
  }

  console.log(`\n🎉 Pricing seed completed!`);
  console.log(`   - IngredientMaster: ${ingredientMasterMap.size} records`);
  console.log(`   - IngredientTemplate: ${templateMap.size} records`);
  console.log(`   - IngredientTemplateItem: ${itemsCreated} records`);
  console.log(`   - Total expected: ${ingredients.length * templates.length} items`);
}

seedPricingData()
  .catch(console.error)
  .finally(() => setTimeout(() => process.exit(0), 100));
