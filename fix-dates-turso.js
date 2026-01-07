// Turso DB 날짜 형식 수정 스크립트
// "2026-01-05 23:01:40" -> "2026-01-05T23:01:40.000Z" (ISO 8601)

const { createClient } = require('@libsql/client');

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('❌ TURSO_DATABASE_URL과 TURSO_AUTH_TOKEN 환경변수가 필요합니다.');
    process.exit(1);
  }

  console.log('🔗 Turso DB 연결 중...');
  const client = createClient({ url, authToken });

  // 수정이 필요한 테이블과 날짜 컬럼 목록
  const tablesToFix = [
    { table: 'Store', columns: ['createdAt', 'updatedAt'] },
    { table: 'User', columns: ['createdAt', 'updatedAt'] },
    { table: 'Task', columns: ['startDate', 'dueDate', 'createdAt', 'updatedAt'] },
    { table: 'Milestone', columns: ['date', 'createdAt', 'updatedAt'] },
    { table: 'PlannedOpenDate', columns: ['date', 'createdAt'] },
    { table: 'Country', columns: ['createdAt'] },
    { table: 'AuditLog', columns: ['createdAt'] },
    { table: 'Notification', columns: ['sentAt', 'createdAt'] },
    { table: 'Vendor', columns: ['createdAt', 'updatedAt'] },
    { table: 'VendorContact', columns: ['createdAt', 'updatedAt'] },
    { table: 'IngredientMaster', columns: ['createdAt', 'updatedAt'] },
    { table: 'IngredientTemplate', columns: ['createdAt', 'updatedAt'] },
    { table: 'IngredientTemplateItem', columns: ['createdAt', 'updatedAt'] },
    { table: 'PriceHistory', columns: ['createdAt'] },
    { table: 'MenuManual', columns: ['createdAt', 'updatedAt'] },
    { table: 'ManualGroup', columns: ['createdAt', 'updatedAt'] },
    { table: 'ManualIngredient', columns: ['createdAt', 'updatedAt'] },
    { table: 'ManualCostVersion', columns: ['calculatedAt', 'createdAt', 'updatedAt'] },
    { table: 'ManualCostLine', columns: ['createdAt', 'updatedAt'] },
    { table: 'Template', columns: ['createdAt'] },
    { table: 'StoreFile', columns: ['createdAt'] },
    { table: 'TaskComment', columns: ['createdAt', 'updatedAt'] },
    { table: 'TaskChecklistItem', columns: ['createdAt', 'updatedAt'] },
  ];

  for (const { table, columns } of tablesToFix) {
    console.log(`\n📋 ${table} 테이블 처리 중...`);
    
    try {
      // 먼저 테이블이 존재하는지 확인
      const checkResult = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
      if (checkResult.rows.length === 0) {
        console.log(`   ⏭️  테이블이 존재하지 않음, 건너뜀`);
        continue;
      }

      // 각 컬럼에 대해 날짜 형식 수정
      for (const column of columns) {
        try {
          // 현재 데이터 확인
          const sampleResult = await client.execute(`SELECT id, "${column}" FROM "${table}" LIMIT 1`);
          if (sampleResult.rows.length > 0) {
            const sampleValue = sampleResult.rows[0][column];
            console.log(`   📅 ${column}: 샘플값 = "${sampleValue}"`);
            
            // "YYYY-MM-DD HH:MM:SS" 형식을 "YYYY-MM-DDTHH:MM:SS.000Z" 형식으로 변환
            // SQLite에서 직접 변환
            const updateQuery = `
              UPDATE "${table}" 
              SET "${column}" = REPLACE("${column}", ' ', 'T') || '.000Z'
              WHERE "${column}" IS NOT NULL 
                AND "${column}" NOT LIKE '%T%'
                AND "${column}" LIKE '____-__-__ __:__:__'
            `;
            
            const result = await client.execute(updateQuery);
            console.log(`   ✅ ${column}: ${result.rowsAffected || 0}개 행 업데이트`);
          } else {
            console.log(`   ⏭️  ${column}: 데이터 없음`);
          }
        } catch (columnError) {
          // 컬럼이 없는 경우 등
          console.log(`   ⚠️  ${column}: ${columnError.message?.substring(0, 50) || '컬럼 처리 실패'}`);
        }
      }
    } catch (tableError) {
      console.log(`   ❌ 테이블 처리 실패: ${tableError.message?.substring(0, 50) || '알 수 없는 오류'}`);
    }
  }

  // 결과 확인
  console.log('\n\n📊 Store 테이블 확인...');
  try {
    const storeCheck = await client.execute('SELECT id, tempName, createdAt, updatedAt FROM Store LIMIT 3');
    console.log('Store 데이터 샘플:');
    storeCheck.rows.forEach(row => {
      console.log(`   - ${row.tempName || row.id}: createdAt=${row.createdAt}, updatedAt=${row.updatedAt}`);
    });
  } catch (e) {
    console.log('   Store 확인 실패:', e.message);
  }

  console.log('\n✅ 날짜 형식 수정 완료!');
}

main().catch(console.error);
