import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. List all tables
    const tables: any[] = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    
    // 2. Get info for ManualCostVersion
    let columns: any[] = [];
    try {
      columns = await prisma.$queryRaw`PRAGMA table_info("ManualCostVersion")`;
    } catch (e) {
      console.error('Failed to get info for ManualCostVersion', e);
    }

    // 3. Get info for MenuManual
    let manualColumns: any[] = [];
    try {
      manualColumns = await prisma.$queryRaw`PRAGMA table_info("MenuManual")`;
    } catch (e) {
      console.error('Failed to get info for MenuManual', e);
    }

    return NextResponse.json({ 
      tables: tables.map(t => t.name),
      manualCostVersionColumns: columns,
      menuManualColumns: manualColumns
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
