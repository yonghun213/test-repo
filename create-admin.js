const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('Creating admin user...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });
  
  console.log('✅ Admin created:', admin.email);
  
  // 다른 사용자들도 생성
  const pm = await prisma.user.upsert({
    where: { email: 'pm@example.com' },
    update: {},
    create: {
      email: 'pm@example.com',
      password: hashedPassword,
      name: 'Project Manager',
      role: 'PM'
    }
  });
  console.log('✅ PM created:', pm.email);
  
  await prisma.$disconnect();
}

createAdmin();
