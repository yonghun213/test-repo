// Turso DB에 새 테이블 생성 스크립트
// 사용법: TURSO_DATABASE_URL=xxx TURSO_AUTH_TOKEN=xxx node setup-turso-tables.js

const { createClient } = require('@libsql/client');

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('❌ TURSO_DATABASE_URL과 TURSO_AUTH_TOKEN 환경변수가 필요합니다.');
    console.log('');
    console.log('사용법:');
    console.log('  Windows PowerShell:');
    console.log('    $env:TURSO_DATABASE_URL="libsql://your-db.turso.io"');
    console.log('    $env:TURSO_AUTH_TOKEN="your-token"');
    console.log('    node setup-turso-tables.js');
    console.log('');
    console.log('  또는 한 줄로:');
    console.log('    $env:TURSO_DATABASE_URL="xxx"; $env:TURSO_AUTH_TOKEN="yyy"; node setup-turso-tables.js');
    process.exit(1);
  }

  console.log('🔗 Turso DB 연결 중...');
  console.log(`   URL: ${url.substring(0, 40)}...`);

  const client = createClient({ url, authToken });

  const queries = [
    // TaskComment 테이블
    `CREATE TABLE IF NOT EXISTS TaskComment (
      id TEXT PRIMARY KEY NOT NULL,
      taskId TEXT NOT NULL,
      userId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (taskId) REFERENCES Task(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    )`,
    
    // TaskChecklistItem 테이블
    `CREATE TABLE IF NOT EXISTS TaskChecklistItem (
      id TEXT PRIMARY KEY NOT NULL,
      taskId TEXT NOT NULL,
      content TEXT NOT NULL,
      isCompleted INTEGER DEFAULT 0 NOT NULL,
      "order" INTEGER DEFAULT 0 NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (taskId) REFERENCES Task(id) ON DELETE CASCADE
    )`,

    // 인덱스
    `CREATE INDEX IF NOT EXISTS TaskComment_taskId_idx ON TaskComment(taskId)`,
    `CREATE INDEX IF NOT EXISTS TaskComment_userId_idx ON TaskComment(userId)`,
    `CREATE INDEX IF NOT EXISTS TaskChecklistItem_taskId_idx ON TaskChecklistItem(taskId)`,
  ];

  try {
    for (const sql of queries) {
      const tableName = sql.match(/(?:CREATE TABLE|CREATE INDEX).*?(\w+)/i)?.[1] || 'query';
      console.log(`📦 실행 중: ${tableName}...`);
      await client.execute(sql);
      console.log(`   ✅ 완료`);
    }

    // 테이블 확인
    console.log('\n📋 테이블 목록 확인:');
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    tables.rows.forEach(row => console.log(`   - ${row.name}`));

    console.log('\n✅ 모든 테이블이 성공적으로 생성되었습니다!');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

main();
