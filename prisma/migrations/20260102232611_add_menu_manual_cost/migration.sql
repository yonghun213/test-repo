-- CreateTable
CREATE TABLE "MenuManual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "koreanName" TEXT,
    "shelfLife" TEXT,
    "yield" REAL,
    "yieldUnit" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ManualIngredient" (
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
    CONSTRAINT "ManualIngredient_manualId_fkey" FOREIGN KEY ("manualId") REFERENCES "MenuManual" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ManualIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "IngredientMaster" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManualCostVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manualId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "costPerUnit" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "calculatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManualCostVersion_manualId_fkey" FOREIGN KEY ("manualId") REFERENCES "MenuManual" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ManualCostVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "IngredientTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManualCostLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "costVersionId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "unitPrice" REAL NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "yieldRate" REAL NOT NULL DEFAULT 100,
    "lineCost" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManualCostLine_costVersionId_fkey" FOREIGN KEY ("costVersionId") REFERENCES "ManualCostVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ManualCostLine_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ManualIngredient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ManualCostVersion_manualId_templateId_key" ON "ManualCostVersion"("manualId", "templateId");
