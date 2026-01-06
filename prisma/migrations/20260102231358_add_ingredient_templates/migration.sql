-- CreateTable
CREATE TABLE "IngredientMaster" (
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

-- CreateTable
CREATE TABLE "IngredientTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "description" TEXT,
    "storeIds" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IngredientTemplateItem" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IngredientTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "IngredientTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IngredientTemplateItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "IngredientMaster" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "IngredientTemplateItem_templateId_ingredientId_key" ON "IngredientTemplateItem"("templateId", "ingredientId");
