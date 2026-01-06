const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany();
  console.log('Users in database:');
  users.forEach(user => {
    console.log(`- ${user.email} (${user.role})`);
    console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
  });
  
  // Test password comparison
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  });
  
  if (admin) {
    const isValid = await bcrypt.compare('password123', admin.password);
    console.log('\nPassword check for admin@example.com:');
    console.log(`password123 valid: ${isValid}`);
  } else {
    console.log('\nAdmin user not found!');
  }
  
  await prisma.$disconnect();
}

checkUsers();
