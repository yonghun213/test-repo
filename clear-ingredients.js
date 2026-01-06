const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAll() {
  console.log('=== Local SQLite 데이터 삭제 시작 ===');
  
  // 1. IngredientTemplateItem 삭제
  const items = await prisma.ingredientTemplateItem.count();
  console.log('IngredientTemplateItem 삭제:', items, '개');
  await prisma.ingredientTemplateItem.deleteMany();
  
  // 2. IngredientTemplate 삭제
  const templates = await prisma.ingredientTemplate.count();
  console.log('IngredientTemplate 삭제:', templates, '개');
  await prisma.ingredientTemplate.deleteMany();
  
  // 3. IngredientMaster 삭제
  const masters = await prisma.ingredientMaster.count();
  console.log('IngredientMaster 삭제:', masters, '개');
  await prisma.ingredientMaster.deleteMany();
  
  console.log('\n=== Local SQLite 삭제 완료 ===');
  
  // 확인
  const check1 = await prisma.ingredientMaster.count();
  const check2 = await prisma.ingredientTemplate.count();
  const check3 = await prisma.ingredientTemplateItem.count();
  console.log('\n=== 확인 ===');
  console.log('IngredientMaster:', check1);
  console.log('IngredientTemplate:', check2);
  console.log('IngredientTemplateItem:', check3);
  
  await prisma.$disconnect();
}

clearAll().catch(e => {
  console.error(e);
  process.exit(1);
});
