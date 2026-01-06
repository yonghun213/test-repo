const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function createAdminInTurso() {
  console.log('🔗 Connecting to Turso...');
  console.log('URL:', process.env.TURSO_DATABASE_URL);
  
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // 기존 사용자 확인
    const existing = await db.execute({
      sql: 'SELECT * FROM User WHERE email = ?',
      args: ['admin@example.com'],
    });
    
    console.log('Existing users:', existing.rows.length);
    
    if (existing.rows.length > 0) {
      console.log('Admin already exists, updating password...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.execute({
        sql: 'UPDATE User SET password = ? WHERE email = ?',
        args: [hashedPassword, 'admin@example.com'],
      });
      console.log('✅ Admin password updated!');
    } else {
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      const id = `user_${Date.now()}`;
      
      await db.execute({
        sql: 'INSERT INTO User (id, email, password, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [id, 'admin@example.com', hashedPassword, 'Admin User', 'ADMIN', new Date().toISOString(), new Date().toISOString()],
      });
      console.log('✅ Admin created in Turso!');
    }
    
    // 확인
    const check = await db.execute({
      sql: 'SELECT id, email, name, role FROM User',
      args: [],
    });
    console.log('\n=== Users in Turso ===');
    check.rows.forEach(u => console.log(`- ${u.email} (${u.role})`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createAdminInTurso();
