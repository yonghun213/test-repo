// Turso에 새 테이블 추가 스크립트
const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const newTableStatements = [
  // User 테이블에 assigneeId 지원을 위한 Task 테이블 업데이트
  `ALTER TABLE "Task" ADD COLUMN "assigneeId" TEXT`,

  // Vendor 테이블
  `CREATE TABLE IF NOT EXISTS "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // VendorContact 테이블
  `CREATE TABLE IF NOT EXISTS "VendorContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "isPrimary" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE
  )`,

  // PriceHistory 테이블
  `CREATE TABLE IF NOT EXISTS "PriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateItemId" TEXT NOT NULL,
    "oldPrice" REAL NOT NULL,
    "newPrice" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("templateItemId") REFERENCES "IngredientTemplateItem" ("id") ON DELETE CASCADE
  )`,

  // ManualCostVersion 테이블에 name 컬럼 추가
  `ALTER TABLE "ManualCostVersion" ADD COLUMN "name" TEXT DEFAULT 'Cost Version'`,
];

async function updateSchema() {
  console.log('Updating Turso schema with new tables...\n');

  for (const sql of newTableStatements) {
    try {
      await client.execute(sql);
      const tableName = sql.includes('ALTER') ? 'Task (ALTER)' : sql.match(/"(\w+)"/)?.[1] || 'Unknown';
      console.log(`✅ ${tableName}`);
    } catch (error) {
      // 이미 존재하거나 이미 ALTER된 경우 무시
      if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
        const tableName = sql.includes('ALTER') ? 'Task.assigneeId' : sql.match(/"(\w+)"/)?.[1] || 'Unknown';
        console.log(`⏭️  ${tableName} (already exists)`);
      } else {
        console.error(`❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n✅ Schema update complete!');
  process.exit(0);
}

updateSchema();
