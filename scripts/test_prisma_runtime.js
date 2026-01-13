
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Prisma Client connection...');
    
    // 1. 기존 테이블(User) 조회 테스트
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);

    // 2. 신규 테이블(InventoryGroup) 쓰기 테스트
    const newGroup = await prisma.inventoryGroup.create({
      data: {
        name: 'Test Group ' + Date.now(),
      },
    });
    console.log('Successfully created InventoryGroup:', newGroup);

    // 3. 정리
    await prisma.inventoryGroup.delete({
      where: { id: newGroup.id },
    });
    console.log('Successfully cleaned up test data.');
    console.log('✅ Prisma Runtime is working correctly!');

  } catch (e) {
    console.error('❌ Prisma Runtime Error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
