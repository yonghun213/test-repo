const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  console.log('=== 시딩 결과 확인 ===');
  
  const masterCount = await prisma.ingredientMaster.count();
  console.log('IngredientMaster:', masterCount);
  
  const templateCount = await prisma.ingredientTemplate.count();
  console.log('IngredientTemplate:', templateCount);
  
  const itemCount = await prisma.ingredientTemplateItem.count();
  console.log('IngredientTemplateItem:', itemCount);
  
  // 템플릿별 상세
  const templates = await prisma.ingredientTemplate.findMany({
    include: {
      _count: {
        select: { items: true }
      }
    }
  });
  
  console.log('\n=== 템플릿 상세 ===');
  for (const t of templates) {
    console.log(`${t.name} (${t.country}): ${t._count.items}개 아이템`);
  }
  
  // 가격이 설정된 아이템 수
  const pricesSet = await prisma.ingredientTemplateItem.count({
    where: { price: { gt: 0 } }
  });
  console.log('\n가격이 설정된 아이템:', pricesSet);
  
  await prisma.$disconnect();
}

checkData();
