import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Starting schema fix...');
    const results = [];

    // 1. Add 'name' column
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ManualCostVersion" ADD COLUMN "name" TEXT DEFAULT 'Cost Version'`);
      results.push('✅ Added column: name');
    } catch (e: any) {
      results.push(`ℹ️ Column 'name' might exist: ${e.message}`);
    }

    // 2. Add 'costPerUnit' column
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ManualCostVersion" ADD COLUMN "costPerUnit" REAL`);
      results.push('✅ Added column: costPerUnit');
    } catch (e: any) {
      results.push(`ℹ️ Column 'costPerUnit' might exist: ${e.message}`);
    }

    // 3. Add 'currency' column
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ManualCostVersion" ADD COLUMN "currency" TEXT DEFAULT 'CAD'`);
      results.push('✅ Added column: currency');
    } catch (e: any) {
      results.push(`ℹ️ Column 'currency' might exist: ${e.message}`);
    }

    // 4. Add 'description' column
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ManualCostVersion" ADD COLUMN "description" TEXT`);
      results.push('✅ Added column: description');
    } catch (e: any) {
      results.push(`ℹ️ Column 'description' might exist: ${e.message}`);
    }

    // 5. Add 'calculatedAt' column
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ManualCostVersion" ADD COLUMN "calculatedAt" DATETIME`);
      results.push('✅ Added column: calculatedAt');
    } catch (e: any) {
      results.push(`ℹ️ Column 'calculatedAt' might exist: ${e.message}`);
    }

    // 6. Add 'totalCost' column (Just in case)
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ManualCostVersion" ADD COLUMN "totalCost" REAL DEFAULT 0`);
      results.push('✅ Added column: totalCost');
    } catch (e: any) {
      results.push(`ℹ️ Column 'totalCost' might exist: ${e.message}`);
    }

    // 7. Add 'isActive' column
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ManualCostVersion" ADD COLUMN "isActive" BOOLEAN DEFAULT 1`);
      results.push('✅ Added column: isActive');
    } catch (e: any) {
      results.push(`ℹ️ Column 'isActive' might exist: ${e.message}`);
    }

    // 8. Add 'createdAt' column
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ManualCostVersion" ADD COLUMN "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP`);
      results.push('✅ Added column: createdAt');
    } catch (e: any) {
      results.push(`ℹ️ Column 'createdAt' might exist: ${e.message}`);
    }

    // 9. Add 'updatedAt' column
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ManualCostVersion" ADD COLUMN "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP`);
      results.push('✅ Added column: updatedAt');
    } catch (e: any) {
      results.push(`ℹ️ Column 'updatedAt' might exist: ${e.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Schema update attempts finished', 
      results 
    });
  } catch (error: any) {
    console.error('Schema fix failed:', error);
    return NextResponse.json({ 
      error: 'Schema fix failed', 
      details: error.message 
    }, { status: 500 });
  }
}
