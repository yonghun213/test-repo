// Turso 데이터베이스 초기화 스크립트
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Country" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tempName" TEXT,
    "officialName" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "timezone" TEXT NOT NULL,
    "storePhone" TEXT,
    "storeEmail" TEXT,
    "ownerName" TEXT,
    "ownerPhone" TEXT,
    "ownerEmail" TEXT,
    "ownerAddress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "createdBy" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "PlannedOpenDate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reason" TEXT,
    "changedBy" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Milestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "TemplatePhase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "TemplateTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "anchorEvent" TEXT NOT NULL DEFAULT 'OPEN_DATE',
    "offsetDays" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "workdayRule" TEXT NOT NULL DEFAULT 'CALENDAR_DAYS',
    "isMilestone" INTEGER NOT NULL DEFAULT 0,
    "roleResponsible" TEXT,
    "order" INTEGER NOT NULL,
    FOREIGN KEY ("phaseId") REFERENCES "TemplatePhase" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "phase" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "startDate" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "sourceType" TEXT NOT NULL DEFAULT 'TEMPLATE',
    "templateTaskId" TEXT,
    "manualOverride" INTEGER NOT NULL DEFAULT 0,
    "locked" INTEGER NOT NULL DEFAULT 0,
    "calendarRule" TEXT NOT NULL DEFAULT 'CALENDAR_DAYS',
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "TaskDependency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "dependsOnTaskId" TEXT NOT NULL,
    FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("dependsOnTaskId") REFERENCES "Task" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "StoreFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "storageType" TEXT NOT NULL DEFAULT 'LOCAL',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "reason" TEXT,
    "metadata" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" INTEGER NOT NULL DEFAULT 0,
    "payload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Ingredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameEn" TEXT NOT NULL,
    "nameLocal" TEXT,
    "unitType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "GroceryPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ingredientId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "retailer" TEXT NOT NULL,
    "packageSize" REAL NOT NULL,
    "packageUnit" TEXT NOT NULL,
    "packagePrice" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "taxIncluded" INTEGER NOT NULL DEFAULT 1,
    "normalizedCost" REAL NOT NULL,
    "asOf" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "menuItem" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "country" TEXT,
    "yield" REAL,
    "notes" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "RecipeLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "qtyUnit" TEXT NOT NULL,
    FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "CompetitorPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "country" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "menuItem" TEXT NOT NULL,
    "size" TEXT,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "asOf" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "FXRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "asOf" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL
  )`,
  // 식재료 마스터 데이터
  `CREATE TABLE IF NOT EXISTS "IngredientMaster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "koreanName" TEXT NOT NULL,
    "englishName" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "yieldRate" REAL NOT NULL DEFAULT 100,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  // 식재료 템플릿 (국가별/매장별 버전)
  `CREATE TABLE IF NOT EXISTS "IngredientTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "description" TEXT,
    "storeIds" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  // 템플릿별 식재료 상세 (가격, 수량 등 오버라이드)
  `CREATE TABLE IF NOT EXISTS "IngredientTemplateItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "category" TEXT,
    "koreanName" TEXT,
    "englishName" TEXT,
    "quantity" REAL,
    "unit" TEXT,
    "yieldRate" REAL,
    "price" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "notes" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("templateId") REFERENCES "IngredientTemplate" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("ingredientId") REFERENCES "IngredientMaster" ("id") ON DELETE CASCADE,
    UNIQUE ("templateId", "ingredientId")
  )`,
  // 매뉴얼 그룹 (가격 템플릿과 매뉴얼들을 묶는 단위)
  `CREATE TABLE IF NOT EXISTS "ManualGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("templateId") REFERENCES "IngredientTemplate" ("id") ON DELETE SET NULL
  )`,
  // 메뉴 매뉴얼 (레시피 저장)
  `CREATE TABLE IF NOT EXISTS "MenuManual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT,
    "menuName" TEXT NOT NULL,
    "menuNameEn" TEXT,
    "category" TEXT,
    "portion" REAL NOT NULL DEFAULT 1,
    "portionUnit" TEXT NOT NULL DEFAULT 'serving',
    "cookingStepsKo" TEXT,
    "cookingStepsEn" TEXT,
    "notes" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("groupId") REFERENCES "ManualGroup" ("id") ON DELETE SET NULL
  )`,
  // 매뉴얼 식재료 (매뉴얼별 사용 식재료)
  `CREATE TABLE IF NOT EXISTS "ManualIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manualId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'g',
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("manualId") REFERENCES "MenuManual" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("ingredientId") REFERENCES "IngredientMaster" ("id") ON DELETE CASCADE
  )`,
  // 매뉴얼 원가 버전
  `CREATE TABLE IF NOT EXISTS "ManualCostVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manualId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "costBreakdown" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("manualId") REFERENCES "MenuManual" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("templateId") REFERENCES "IngredientTemplate" ("id") ON DELETE CASCADE
  )`,
];

async function main() {
  console.log('🚀 Turso 데이터베이스 초기화 시작...');
  console.log('URL:', process.env.TURSO_DATABASE_URL);

  // 1. 테이블 생성
  console.log(`📝 ${createTableStatements.length}개의 테이블 생성 중...`);
  for (const stmt of createTableStatements) {
    try {
      await client.execute(stmt);
    } catch (err) {
      console.error('테이블 생성 오류:', err.message);
    }
  }
  console.log('✅ 테이블 생성 완료');

  // 2. 기존 데이터 삭제 (재시드를 위해)
  console.log('🗑️ 기존 데이터 삭제 중...');
  const tables = ['RecipeLine', 'Recipe', 'GroceryPrice', 'Ingredient', 'CompetitorPrice', 
                  'StoreFile', 'Task', 'TaskDependency', 'TemplateTask', 'TemplatePhase', 
                  'Template', 'PlannedOpenDate', 'Milestone', 'Store', 'Country', 'User'];
  for (const table of tables) {
    try {
      await client.execute(`DELETE FROM "${table}"`);
    } catch (err) {
      // 무시
    }
  }

  // 3. 초기 데이터 삽입
  console.log('🌱 시드 데이터 삽입 중...');

  // Countries
  const countries = [
    { code: 'MX', name: 'Mexico', currency: 'MXN', timezone: 'America/Mexico_City' },
    { code: 'CO', name: 'Colombia', currency: 'COP', timezone: 'America/Bogota' },
    { code: 'CA', name: 'Canada', currency: 'CAD', timezone: 'America/Toronto' },
  ];

  for (const c of countries) {
    await client.execute({
      sql: `INSERT INTO "Country" (id, code, name, currency, timezone) VALUES (?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), c.code, c.name, c.currency, c.timezone],
    });
  }
  console.log('✅ Countries 생성: 3');

  // Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  const users = [
    { email: 'admin@example.com', name: 'Admin User', role: 'ADMIN' },
    { email: 'pm@example.com', name: 'Project Manager', role: 'PM' },
    { email: 'contributor1@example.com', name: 'Contributor One', role: 'CONTRIBUTOR' },
    { email: 'contributor2@example.com', name: 'Contributor Two', role: 'CONTRIBUTOR' },
    { email: 'viewer@example.com', name: 'Viewer User', role: 'VIEWER' },
  ];

  for (const u of users) {
    await client.execute({
      sql: `INSERT INTO "User" (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), u.email, hashedPassword, u.name, u.role],
    });
  }
  console.log('✅ Users 생성: 5');

  // Template
  const templateId = crypto.randomUUID();
  await client.execute({
    sql: `INSERT INTO "Template" (id, name, version, isActive) VALUES (?, ?, ?, ?)`,
    args: [templateId, 'Standard Launch Template', 1, 1],
  });

  // Template Phases
  const phases = [
    { name: 'Pre-Launch', order: 1 },
    { name: 'Site Selection', order: 2 },
    { name: 'Legal & Contracts', order: 3 },
    { name: 'Construction', order: 4 },
    { name: 'Equipment & Setup', order: 5 },
    { name: 'Grand Opening', order: 6 },
  ];

  for (const p of phases) {
    await client.execute({
      sql: `INSERT INTO "TemplatePhase" (id, templateId, name, "order") VALUES (?, ?, ?, ?)`,
      args: [crypto.randomUUID(), templateId, p.name, p.order],
    });
  }
  console.log('✅ Template & Phases 생성: 6');

  // Sample Stores with Open Dates and Timeline Tasks
  const openDate1 = new Date();
  openDate1.setMonth(openDate1.getMonth() + 6); // 6 months from now
  
  const openDate2 = new Date();
  openDate2.setMonth(openDate2.getMonth() + 4); // 4 months from now

  const stores = [
    { 
      id: crypto.randomUUID(),
      tempName: 'MX-001 Polanco', 
      country: 'MX', 
      city: 'Mexico City', 
      timezone: 'America/Mexico_City', 
      status: 'PLANNING',
      openDate: openDate1 
    },
    { 
      id: crypto.randomUUID(),
      tempName: 'CO-001 Chapinero', 
      country: 'CO', 
      city: 'Bogota', 
      timezone: 'America/Bogota', 
      status: 'IN_PROGRESS',
      openDate: openDate2 
    },
  ];

  for (const s of stores) {
    await client.execute({
      sql: `INSERT INTO "Store" (id, tempName, country, city, timezone, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [s.id, s.tempName, s.country, s.city, s.timezone, s.status, 'admin'],
    });
    
    // Create Planned Open Date
    await client.execute({
      sql: `INSERT INTO "PlannedOpenDate" (id, storeId, date, reason, changedBy) VALUES (?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), s.id, s.openDate.toISOString(), 'Initial planning', 'admin'],
    });
  }
  console.log('✅ Stores 생성: 2 (with Planned Open Dates)');

  // Generate timeline tasks for each store
  const templateTasks = [
    // Phase: Deal / Planning
    { name: 'Approve Budget', phase: 'Deal / Planning', anchor: 'OPEN_DATE', offset: -180, duration: 5, rule: 'CALENDAR_DAYS', order: 1 },
    { name: 'Define Store Concept & Format', phase: 'Deal / Planning', anchor: 'OPEN_DATE', offset: -175, duration: 5, rule: 'CALENDAR_DAYS', order: 2 },
    { name: 'Site Survey / Feasibility', phase: 'Deal / Planning', anchor: 'OPEN_DATE', offset: -175, duration: 7, rule: 'CALENDAR_DAYS', order: 3 },
    { name: 'Lease Negotiation', phase: 'Deal / Planning', anchor: 'OPEN_DATE', offset: -170, duration: 21, rule: 'CALENDAR_DAYS', order: 4 },
    { name: 'Contract Signed', phase: 'Deal / Planning', anchor: 'OPEN_DATE', offset: -145, duration: 0, rule: 'CALENDAR_DAYS', priority: 'HIGH', order: 5 },
    { name: 'Sign Lease', phase: 'Deal / Planning', anchor: 'OPEN_DATE', offset: -145, duration: 1, rule: 'CALENDAR_DAYS', order: 6 },
    { name: 'Kickoff: Master Launch Plan', phase: 'Deal / Planning', anchor: 'OPEN_DATE', offset: -144, duration: 2, rule: 'CALENDAR_DAYS', order: 7 },
    
    // Phase: Design & Permits
    { name: 'Select Architect / Designer', phase: 'Design & Permits', anchor: 'OPEN_DATE', offset: -140, duration: 5, rule: 'CALENDAR_DAYS', order: 8 },
    { name: 'Schematic Layout Design', phase: 'Design & Permits', anchor: 'OPEN_DATE', offset: -135, duration: 10, rule: 'CALENDAR_DAYS', order: 9 },
    { name: 'MEP Plan', phase: 'Design & Permits', anchor: 'OPEN_DATE', offset: -125, duration: 10, rule: 'CALENDAR_DAYS', order: 10 },
    { name: 'Finalize Floor Plan', phase: 'Design & Permits', anchor: 'OPEN_DATE', offset: -115, duration: 7, rule: 'CALENDAR_DAYS', order: 11 },
    { name: 'Permit Package Prep', phase: 'Design & Permits', anchor: 'OPEN_DATE', offset: -110, duration: 10, rule: 'CALENDAR_DAYS', order: 12 },
    { name: 'Submit Permits', phase: 'Design & Permits', anchor: 'OPEN_DATE', offset: -100, duration: 1, rule: 'CALENDAR_DAYS', order: 13 },
    { name: 'Permit Review Loop', phase: 'Design & Permits', anchor: 'OPEN_DATE', offset: -99, duration: 30, rule: 'CALENDAR_DAYS', order: 14 },
    { name: 'Permit Approved', phase: 'Design & Permits', anchor: 'OPEN_DATE', offset: -70, duration: 0, rule: 'CALENDAR_DAYS', priority: 'HIGH', order: 15 },
    
    // Phase: Equipment
    { name: 'Equipment List Draft', phase: 'Equipment', anchor: 'OPEN_DATE', offset: -120, duration: 5, rule: 'CALENDAR_DAYS', order: 16 },
    { name: 'Request Quotes', phase: 'Equipment', anchor: 'OPEN_DATE', offset: -115, duration: 7, rule: 'CALENDAR_DAYS', order: 17 },
    { name: 'Select Equipment Vendors', phase: 'Equipment', anchor: 'OPEN_DATE', offset: -108, duration: 3, rule: 'CALENDAR_DAYS', order: 18 },
    { name: 'Place Equipment Orders', phase: 'Equipment', anchor: 'OPEN_DATE', offset: -105, duration: 2, rule: 'CALENDAR_DAYS', order: 19 },
    { name: 'Confirm Delivery Windows', phase: 'Equipment', anchor: 'OPEN_DATE', offset: -90, duration: 2, rule: 'CALENDAR_DAYS', order: 20 },
    
    // Phase: Construction
    { name: 'GC Selection / Contract', phase: 'Construction', anchor: 'OPEN_DATE', offset: -105, duration: 10, rule: 'CALENDAR_DAYS', order: 21 },
    { name: 'Construction Start', phase: 'Construction', anchor: 'OPEN_DATE', offset: -90, duration: 0, rule: 'CALENDAR_DAYS', priority: 'HIGH', order: 22 },
    { name: 'Demolition / Prep', phase: 'Construction', anchor: 'OPEN_DATE', offset: -89, duration: 5, rule: 'CALENDAR_DAYS', order: 23 },
    { name: 'Framing & Rough-in MEP', phase: 'Construction', anchor: 'OPEN_DATE', offset: -84, duration: 20, rule: 'CALENDAR_DAYS', order: 24 },
    { name: 'Rough-in Inspections', phase: 'Construction', anchor: 'OPEN_DATE', offset: -64, duration: 3, rule: 'CALENDAR_DAYS', order: 25 },
    { name: 'Drywall / Finishes', phase: 'Construction', anchor: 'OPEN_DATE', offset: -61, duration: 20, rule: 'CALENDAR_DAYS', order: 26 },
    { name: 'Signage Install Plan', phase: 'Construction', anchor: 'OPEN_DATE', offset: -45, duration: 10, rule: 'CALENDAR_DAYS', order: 27 },
    { name: 'Equipment Install', phase: 'Construction', anchor: 'OPEN_DATE', offset: -28, duration: 7, rule: 'CALENDAR_DAYS', order: 28 },
    { name: 'Final Clean', phase: 'Construction', anchor: 'OPEN_DATE', offset: -5, duration: 2, rule: 'CALENDAR_DAYS', order: 29 },
    
    // Phase: IT & Systems
    { name: 'Select POS', phase: 'IT & Systems', anchor: 'OPEN_DATE', offset: -90, duration: 7, rule: 'CALENDAR_DAYS', order: 30 },
    { name: 'Order POS Hardware', phase: 'IT & Systems', anchor: 'OPEN_DATE', offset: -80, duration: 3, rule: 'CALENDAR_DAYS', order: 31 },
    { name: 'Install Network', phase: 'IT & Systems', anchor: 'OPEN_DATE', offset: -21, duration: 2, rule: 'CALENDAR_DAYS', order: 32 },
    { name: 'Configure POS', phase: 'IT & Systems', anchor: 'OPEN_DATE', offset: -14, duration: 7, rule: 'CALENDAR_DAYS', order: 33 },
    
    // Phase: Licensing
    { name: 'Business License App', phase: 'Licensing', anchor: 'OPEN_DATE', offset: -60, duration: 10, rule: 'CALENDAR_DAYS', order: 34 },
    { name: 'Health Inspection', phase: 'Licensing', anchor: 'OPEN_DATE', offset: -14, duration: 1, rule: 'CALENDAR_DAYS', order: 35 },
    { name: 'Business License Issued', phase: 'Licensing', anchor: 'OPEN_DATE', offset: -3, duration: 0, rule: 'CALENDAR_DAYS', priority: 'HIGH', order: 36 },
    
    // Phase: Hiring & Training
    { name: 'Hire Store Manager', phase: 'Hiring & Training', anchor: 'OPEN_DATE', offset: -60, duration: 14, rule: 'CALENDAR_DAYS', order: 37 },
    { name: 'Hire Crew', phase: 'Hiring & Training', anchor: 'OPEN_DATE', offset: -30, duration: 14, rule: 'CALENDAR_DAYS', order: 38 },
    { name: 'Training Day 1', phase: 'Hiring & Training', anchor: 'OPEN_DATE', offset: -10, duration: 1, rule: 'BUSINESS_DAYS_MON_FRI', order: 39 },
    { name: 'Training Day 2', phase: 'Hiring & Training', anchor: 'OPEN_DATE', offset: -9, duration: 1, rule: 'BUSINESS_DAYS_MON_FRI', order: 40 },
    { name: 'Training Day 3', phase: 'Hiring & Training', anchor: 'OPEN_DATE', offset: -8, duration: 1, rule: 'BUSINESS_DAYS_MON_FRI', order: 41 },
    
    // Phase: Opening
    { name: 'Soft Open', phase: 'Opening', anchor: 'OPEN_DATE', offset: -3, duration: 0, rule: 'CALENDAR_DAYS', priority: 'HIGH', order: 42 },
    { name: 'Soft Opening Day 1', phase: 'Opening', anchor: 'OPEN_DATE', offset: -3, duration: 1, rule: 'CALENDAR_DAYS', order: 43 },
    { name: 'Grand Open', phase: 'Opening', anchor: 'OPEN_DATE', offset: 0, duration: 0, rule: 'CALENDAR_DAYS', priority: 'HIGH', order: 44 },
    { name: 'Grand Opening Execution', phase: 'Opening', anchor: 'OPEN_DATE', offset: 0, duration: 1, rule: 'CALENDAR_DAYS', order: 45 },
  ];

  let totalTasks = 0;
  for (const store of stores) {
    for (const task of templateTasks) {
      const startDate = new Date(store.openDate);
      startDate.setDate(startDate.getDate() + task.offset);
      
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + task.duration);
      
      await client.execute({
        sql: `INSERT INTO "Task" (id, storeId, title, phase, startDate, dueDate, status, priority, sourceType, calendarRule) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(),
          store.id,
          task.name,
          task.phase,
          startDate.toISOString(),
          dueDate.toISOString(),
          'NOT_STARTED',
          task.priority || 'MEDIUM',
          'TEMPLATE',
          task.rule,
        ],
      });
      totalTasks++;
    }
  }
  console.log(`✅ Timeline Tasks 생성: ${totalTasks} (${templateTasks.length} per store)`);


  console.log('');
  console.log('🎉 Turso 데이터베이스 초기화 완료!');
  console.log('');
  console.log('📌 로그인 정보:');
  console.log('   Admin: admin@example.com / password123');
  console.log('   PM: pm@example.com / password123');
  console.log('   Contributor: contributor1@example.com / password123');
  console.log('   Viewer: viewer@example.com / password123');
}

main().catch(console.error);
