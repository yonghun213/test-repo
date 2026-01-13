
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.');
  process.exit(1);
}

const db = createClient({
  url,
  authToken,
});

const schema = `
-- User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Store
CREATE TABLE IF NOT EXISTS "Store" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- InventoryGroup
CREATE TABLE IF NOT EXISTS "InventoryGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryGroup_name_key" ON "InventoryGroup"("name");

-- InventoryPeriod
CREATE TABLE IF NOT EXISTS "InventoryPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("groupId") REFERENCES "InventoryGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- IngredientMaster
CREATE TABLE IF NOT EXISTS "IngredientMaster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "koreanName" TEXT NOT NULL,
    "englishName" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "yieldRate" REAL NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- InventoryItem
CREATE TABLE IF NOT EXISTS "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryPeriodId" TEXT NOT NULL,
    "ingredientMasterId" TEXT NOT NULL,
    "openingStock" REAL NOT NULL,
    "stockIn" REAL NOT NULL DEFAULT 0,
    "wastage" REAL NOT NULL DEFAULT 0,
    "actualClosingStock" REAL NOT NULL,
    "totalUsage" REAL,
    "theoreticalUsage" REAL,
    "variance" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("inventoryPeriodId") REFERENCES "InventoryPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("ingredientMasterId") REFERENCES "IngredientMaster" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryItem_period_ingredient_key" ON "InventoryItem"("inventoryPeriodId", "ingredientMasterId");

-- MenuManual
CREATE TABLE IF NOT EXISTS "MenuManual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "koreanName" TEXT,
    "imageUrl" TEXT,
    "shelfLife" TEXT,
    "yield" REAL,
    "yieldUnit" TEXT,
    "sellingPrice" REAL,
    "notes" TEXT,
    "cookingMethod" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "isArchived" BOOLEAN NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "groupId" TEXT
);

-- PosMenuLink
CREATE TABLE IF NOT EXISTS "PosMenuLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "posMenuName" TEXT NOT NULL,
    "menuManualId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("groupId") REFERENCES "InventoryGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("menuManualId") REFERENCES "MenuManual" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PosMenuLink_group_posMenuName_key" ON "PosMenuLink"("groupId", "posMenuName");

-- PeriodSales
CREATE TABLE IF NOT EXISTS "PeriodSales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryPeriodId" TEXT NOT NULL,
    "posMenuLinkId" TEXT NOT NULL,
    "quantitySold" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("inventoryPeriodId") REFERENCES "InventoryPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("posMenuLinkId") REFERENCES "PosMenuLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PeriodSales_period_link_key" ON "PeriodSales"("inventoryPeriodId", "posMenuLinkId");

-- ManualIngredient (필수 의존성)
CREATE TABLE IF NOT EXISTS "ManualIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manualId" TEXT NOT NULL,
    "ingredientId" TEXT,
    "name" TEXT NOT NULL,
    "koreanName" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'MAIN',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("manualId") REFERENCES "MenuManual" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("ingredientId") REFERENCES "IngredientMaster" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
`;

async function main() {
  console.log('Initializing Turso Database...');
  
  // Split schema by semicolon to execute one by one
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await db.execute(statement);
      console.log('Executed SQL statement successfully.');
    } catch (e) {
      console.error('Error executing SQL:', e.message);
      // Don't exit, try to continue (e.g. if table exists)
    }
  }

  console.log('✅ Turso Database initialization completed.');
}

main();
