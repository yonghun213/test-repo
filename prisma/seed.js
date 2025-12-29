const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create countries
  const countries = await Promise.all([
    prisma.country.create({
      data: {
        code: 'MX',
        name: 'Mexico',
        currency: 'MXN',
        timezone: 'America/Mexico_City',
      },
    }),
    prisma.country.create({
      data: {
        code: 'CO',
        name: 'Colombia',
        currency: 'COP',
        timezone: 'America/Bogota',
      },
    }),
    prisma.country.create({
      data: {
        code: 'CA',
        name: 'Canada',
        currency: 'CAD',
        timezone: 'America/Toronto',
      },
    }),
  ]);
  console.log('✅ Created countries:', countries.length);

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        email: 'pm@example.com',
        password: hashedPassword,
        name: 'Project Manager',
        role: 'PM',
      },
    }),
    prisma.user.create({
      data: {
        email: 'contributor1@example.com',
        password: hashedPassword,
        name: 'Contributor One',
        role: 'CONTRIBUTOR',
      },
    }),
    prisma.user.create({
      data: {
        email: 'contributor2@example.com',
        password: hashedPassword,
        name: 'Contributor Two',
        role: 'CONTRIBUTOR',
      },
    }),
    prisma.user.create({
      data: {
        email: 'viewer@example.com',
        password: hashedPassword,
        name: 'Viewer User',
        role: 'VIEWER',
      },
    }),
  ]);
  console.log('✅ Created users:', users.length);

  // Create template
  const template = await prisma.template.create({
    data: {
      name: 'Standard Store Opening',
      version: 1,
      isActive: true,
    },
  });

  // Create phases
  const phases = await Promise.all([
    prisma.templatePhase.create({
      data: {
        templateId: template.id,
        name: 'Pre-Contract',
        order: 1,
      },
    }),
    prisma.templatePhase.create({
      data: {
        templateId: template.id,
        name: 'Contract & Permits',
        order: 2,
      },
    }),
    prisma.templatePhase.create({
      data: {
        templateId: template.id,
        name: 'Construction',
        order: 3,
      },
    }),
    prisma.templatePhase.create({
      data: {
        templateId: template.id,
        name: 'Equipment & Training',
        order: 4,
      },
    }),
    prisma.templatePhase.create({
      data: {
        templateId: template.id,
        name: 'Pre-Opening',
        order: 5,
      },
    }),
    prisma.templatePhase.create({
      data: {
        templateId: template.id,
        name: 'Opening',
        order: 6,
      },
    }),
  ]);
  console.log('✅ Created template phases:', phases.length);

  // Create template tasks
  const tasks = [
    { phaseId: phases[0].id, title: 'Site Survey', offsetDays: -90, order: 1 },
    { phaseId: phases[0].id, title: 'Business Plan Review', offsetDays: -85, order: 2 },
    { phaseId: phases[1].id, title: 'Sign Lease Contract', offsetDays: -75, order: 3, isMilestone: true },
    { phaseId: phases[1].id, title: 'Submit Permit Applications', offsetDays: -70, order: 4 },
    { phaseId: phases[1].id, title: 'Receive Health Permit', offsetDays: -50, order: 5 },
    { phaseId: phases[2].id, title: 'Construction Kickoff', offsetDays: -60, order: 6, isMilestone: true },
    { phaseId: phases[2].id, title: 'Electrical Installation', offsetDays: -55, order: 7, durationDays: 5 },
    { phaseId: phases[2].id, title: 'Plumbing Installation', offsetDays: -50, order: 8, durationDays: 5 },
    { phaseId: phases[2].id, title: 'Flooring & Painting', offsetDays: -45, order: 9, durationDays: 7 },
    { phaseId: phases[2].id, title: 'Construction Final Inspection', offsetDays: -30, order: 10 },
    { phaseId: phases[3].id, title: 'Order Kitchen Equipment', offsetDays: -60, order: 11 },
    { phaseId: phases[3].id, title: 'Equipment Installation', offsetDays: -25, order: 12, durationDays: 3 },
    { phaseId: phases[3].id, title: 'POS System Setup', offsetDays: -20, order: 13 },
    { phaseId: phases[3].id, title: 'Staff Hiring', offsetDays: -40, order: 14, durationDays: 10 },
    { phaseId: phases[3].id, title: 'Staff Training', offsetDays: -15, order: 15, durationDays: 5 },
    { phaseId: phases[4].id, title: 'Initial Inventory Order', offsetDays: -14, order: 16 },
    { phaseId: phases[4].id, title: 'Soft Opening', offsetDays: -7, order: 17, isMilestone: true },
    { phaseId: phases[4].id, title: 'Menu Testing', offsetDays: -6, order: 18, durationDays: 3 },
    { phaseId: phases[4].id, title: 'Marketing Campaign Launch', offsetDays: -10, order: 19 },
    { phaseId: phases[5].id, title: 'Grand Opening', offsetDays: 0, order: 20, isMilestone: true },
    { phaseId: phases[5].id, title: 'Post-Opening Support', offsetDays: 1, order: 21, durationDays: 7 },
  ];

  await Promise.all(
    tasks.map((task) =>
      prisma.templateTask.create({
        data: {
          ...task,
          durationDays: task.durationDays || 1,
          isMilestone: task.isMilestone || false,
        },
      })
    )
  );
  console.log('✅ Created template tasks:', tasks.length);

  // Create stores
  const openDate1 = new Date('2025-03-15');
  const store1 = await prisma.store.create({
    data: {
      tempName: 'BBQ Mexico City Centro',
      country: 'MX',
      city: 'Mexico City',
      timezone: 'America/Mexico_City',
      status: 'PLANNING',
      createdBy: users[0].id,
      ownerName: 'Juan Rodriguez',
      ownerPhone: '+52-555-1234567',
      ownerEmail: 'juan.rodriguez@example.com',
      plannedOpenDates: {
        create: {
          date: openDate1,
          reason: 'Initial planned date',
          changedBy: users[0].id,
        },
      },
    },
  });

  const openDate2 = new Date('2025-04-20');
  const store2 = await prisma.store.create({
    data: {
      tempName: 'BBQ Bogota Norte',
      officialName: 'BBQ Chicken Bogota Norte',
      country: 'CO',
      city: 'Bogota',
      timezone: 'America/Bogota',
      status: 'CONTRACT_SIGNED',
      createdBy: users[1].id,
      ownerName: 'Maria Garcia',
      ownerPhone: '+57-1-2345678',
      ownerEmail: 'maria.garcia@example.com',
      plannedOpenDates: {
        create: {
          date: openDate2,
          reason: 'Initial planned date',
          changedBy: users[1].id,
        },
      },
    },
  });
  console.log('✅ Created stores:', 2);

  // Create ingredients
  const ingredients = [
    { nameEn: 'Chicken Breast', unitType: 'kg', category: 'Protein' },
    { nameEn: 'Chicken Thigh', unitType: 'kg', category: 'Protein' },
    { nameEn: 'Chicken Wings', unitType: 'kg', category: 'Protein' },
    { nameEn: 'All-Purpose Flour', unitType: 'kg', category: 'Dry Goods' },
    { nameEn: 'Breadcrumbs', unitType: 'kg', category: 'Dry Goods' },
    { nameEn: 'BBQ Sauce', unitType: 'L', category: 'Sauce' },
    { nameEn: 'Hot Sauce', unitType: 'L', category: 'Sauce' },
    { nameEn: 'Garlic Powder', unitType: 'kg', category: 'Spices' },
    { nameEn: 'Paprika', unitType: 'kg', category: 'Spices' },
    { nameEn: 'Black Pepper', unitType: 'kg', category: 'Spices' },
    { nameEn: 'Salt', unitType: 'kg', category: 'Spices' },
    { nameEn: 'Vegetable Oil', unitType: 'L', category: 'Oil' },
    { nameEn: 'Onion', unitType: 'kg', category: 'Vegetables' },
    { nameEn: 'Potato', unitType: 'kg', category: 'Vegetables' },
    { nameEn: 'Lettuce', unitType: 'kg', category: 'Vegetables' },
    { nameEn: 'Tomato', unitType: 'kg', category: 'Vegetables' },
    { nameEn: 'Cabbage', unitType: 'kg', category: 'Vegetables' },
    { nameEn: 'Carrot', unitType: 'kg', category: 'Vegetables' },
    { nameEn: 'Mayonnaise', unitType: 'L', category: 'Condiments' },
    { nameEn: 'Ketchup', unitType: 'L', category: 'Condiments' },
    { nameEn: 'Mustard', unitType: 'L', category: 'Condiments' },
    { nameEn: 'Buns', unitType: 'pcs', category: 'Bakery' },
    { nameEn: 'Tortilla', unitType: 'pcs', category: 'Bakery' },
    { nameEn: 'Cheese', unitType: 'kg', category: 'Dairy' },
    { nameEn: 'Butter', unitType: 'kg', category: 'Dairy' },
  ];

  const createdIngredients = await Promise.all(
    ingredients.map((ing) => prisma.ingredient.create({ data: ing }))
  );
  console.log('✅ Created ingredients:', createdIngredients.length);

  // Create recipes
  const recipes = [
    { menuItem: 'Original Fried Chicken', version: 1, country: 'MX' },
    { menuItem: 'Spicy Fried Chicken', version: 1, country: 'MX' },
    { menuItem: 'BBQ Wings', version: 1, country: 'MX' },
    { menuItem: 'Chicken Burger', version: 1, country: 'MX' },
    { menuItem: 'Chicken Wrap', version: 1, country: 'MX' },
    { menuItem: 'French Fries', version: 1, country: 'MX' },
    { menuItem: 'Coleslaw', version: 1, country: 'MX' },
    { menuItem: 'Original Fried Chicken', version: 1, country: 'CO' },
    { menuItem: 'Spicy Fried Chicken', version: 1, country: 'CO' },
    { menuItem: 'BBQ Wings', version: 1, country: 'CO' },
    { menuItem: 'Chicken Burger', version: 1, country: 'CO' },
    { menuItem: 'Chicken Wrap', version: 1, country: 'CO' },
  ];

  await Promise.all(recipes.map((recipe) => prisma.recipe.create({ data: recipe })));
  console.log('✅ Created recipes:', recipes.length);

  // Create competitor prices
  const competitorPrices = [
    { country: 'MX', brand: 'KFC', menuItem: 'Original Recipe Chicken', price: 89.0, currency: 'MXN', asOf: new Date() },
    { country: 'MX', brand: 'KFC', menuItem: 'Hot Wings', price: 65.0, currency: 'MXN', asOf: new Date() },
    { country: 'MX', brand: 'Popeyes', menuItem: 'Fried Chicken', price: 85.0, currency: 'MXN', asOf: new Date() },
    { country: 'MX', brand: 'Church\'s Chicken', menuItem: 'Original Chicken', price: 79.0, currency: 'MXN', asOf: new Date() },
    { country: 'CO', brand: 'KFC', menuItem: 'Original Recipe Chicken', price: 18900.0, currency: 'COP', asOf: new Date() },
    { country: 'CO', brand: 'KFC', menuItem: 'Hot Wings', price: 14900.0, currency: 'COP', asOf: new Date() },
    { country: 'CO', brand: 'Popeyes', menuItem: 'Fried Chicken', price: 17500.0, currency: 'COP', asOf: new Date() },
    { country: 'CA', brand: 'KFC', menuItem: 'Original Recipe Chicken', price: 12.99, currency: 'CAD', asOf: new Date() },
    { country: 'CA', brand: 'Popeyes', menuItem: 'Fried Chicken', price: 11.99, currency: 'CAD', asOf: new Date() },
  ];

  await Promise.all(competitorPrices.map((cp) => prisma.competitorPrice.create({ data: cp })));
  console.log('✅ Created competitor prices:', competitorPrices.length);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
