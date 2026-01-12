const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

async function seedPricingData() {
  console.log('Starting pricing data seed...');

  // Read Excel file
  const excelPath = path.join(
    'C:/Users/kunbb/OneDrive/기본/바탕 화면/데이터분석 자동화/Master Data File/합쳐진파일/test-repo',
    '원가파일-20250506 (1).xlsx'
  );

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
        koreanName: row[3] || '',
        masterDetail: row[4] || '',
        englishName: row[5] || '',
        quantity: parseFloat(row[6]) || 0,
        unit: row[7] || '',
        yieldRate: parseFloat(row[8]) || 1,
        cadPrice: parseFloat(row[9]) || 0,
      });
    }
  }

  console.log(`Found ${ingredients.length} ingredients to seed`);

  // Create or update IngredientMaster records
  let created = 0;
  let updated = 0;

  for (const ing of ingredients) {
    try {
      // Check if ingredient already exists
      const existing = await prisma.ingredientMaster.findFirst({
        where: {
          OR: [
            { koreanName: ing.koreanName },
            { englishName: ing.englishName }
          ]
        }
      });

      if (existing) {
        // Update existing
        await prisma.ingredientMaster.update({
          where: { id: existing.id },
          data: {
            category: ing.category,
            koreanName: ing.koreanName,
            englishName: ing.englishName,
            quantity: ing.quantity,
            unit: ing.unit,
            yieldRate: ing.yieldRate * 100, // Convert to percentage
          }
        });
        updated++;
      } else {
        // Create new
        await prisma.ingredientMaster.create({
          data: {
            category: ing.category,
            koreanName: ing.koreanName,
            englishName: ing.englishName,
            quantity: ing.quantity,
            unit: ing.unit,
            yieldRate: ing.yieldRate * 100, // Convert to percentage
          }
        });
        created++;
      }
    } catch (error) {
      console.error(`Error processing ingredient ${ing.koreanName}:`, error.message);
    }
  }

  console.log(`Created ${created} new ingredients, updated ${updated} existing`);

  // Create Canada template if not exists
  let canadaTemplate = await prisma.ingredientTemplate.findFirst({
    where: { country: 'CA' }
  });

  if (!canadaTemplate) {
    canadaTemplate = await prisma.ingredientTemplate.create({
      data: {
        name: 'Canada',
        country: 'CA',
        description: 'Canada pricing template',
        isActive: true,
      }
    });
    console.log('Created Canada template');
  } else {
    console.log('Canada template already exists');
  }

  // Get all ingredient masters
  const allIngredients = await prisma.ingredientMaster.findMany();

  // Create template items with Canada prices
  let itemsCreated = 0;
  let itemsUpdated = 0;

  for (const master of allIngredients) {
    // Find matching price from Excel data
    const excelIng = ingredients.find(
      i => i.koreanName === master.koreanName || i.englishName === master.englishName
    );

    const price = excelIng?.cadPrice || 0;

    try {
      // Check if template item exists
      const existingItem = await prisma.ingredientTemplateItem.findFirst({
        where: {
          templateId: canadaTemplate.id,
          ingredientId: master.id
        }
      });

      if (existingItem) {
        // Update price
        await prisma.ingredientTemplateItem.update({
          where: { id: existingItem.id },
          data: {
            price: price,
            currency: 'CAD',
          }
        });
        itemsUpdated++;
      } else {
        // Create new template item
        await prisma.ingredientTemplateItem.create({
          data: {
            templateId: canadaTemplate.id,
            ingredientId: master.id,
            price: price,
            currency: 'CAD',
          }
        });
        itemsCreated++;
      }
    } catch (error) {
      console.error(`Error creating template item for ${master.koreanName}:`, error.message);
    }
  }

  console.log(`Template items: ${itemsCreated} created, ${itemsUpdated} updated`);

  // Create other country templates without prices (Mexico, Colombia, Central America)
  const otherCountries = [
    { code: 'MX', name: 'Mexico', currency: 'MXN' },
    { code: 'CO', name: 'Colombia', currency: 'COP' },
    { code: 'CentralAmerica', name: 'Central America', currency: 'USD' },
  ];

  for (const country of otherCountries) {
    let template = await prisma.ingredientTemplate.findFirst({
      where: { country: country.code }
    });

    if (!template) {
      template = await prisma.ingredientTemplate.create({
        data: {
          name: country.name,
          country: country.code,
          description: `${country.name} pricing template`,
          isActive: true,
        }
      });
      console.log(`Created ${country.name} template`);

      // Create template items without prices
      for (const master of allIngredients) {
        await prisma.ingredientTemplateItem.create({
          data: {
            templateId: template.id,
            ingredientId: master.id,
            price: 0, // No price for non-Canada templates
            currency: country.currency,
          }
        });
      }
      console.log(`Created template items for ${country.name}`);
    }
  }

  console.log('Pricing seed completed!');
}

seedPricingData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
