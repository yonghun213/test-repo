import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
    hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
    tursoUrlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 30) + '...',
  };

  try {
    // Test Turso connection directly
    const { createClient } = require('@libsql/client');
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    
    const result = await db.execute('SELECT COUNT(*) as count FROM User');
    diagnostics.tursoConnection = 'SUCCESS';
    const rawCount = result.rows[0]?.count;
    diagnostics.userCount =
      typeof rawCount === 'bigint'
        ? Number(rawCount)
        : typeof rawCount === 'number'
          ? rawCount
          : typeof rawCount === 'string'
            ? Number(rawCount)
            : rawCount;
  } catch (e: any) {
    diagnostics.tursoConnection = 'FAILED';
    diagnostics.tursoError = e.message;
  }

  try {
    // Check what's exported from adapter-libsql
    const adapterModule = require('@prisma/adapter-libsql');
    diagnostics.adapterExports = Object.keys(adapterModule);
    diagnostics.PrismaLibSqlType = typeof adapterModule.PrismaLibSql;
    
    // Try different export names - PrismaLibSQL (capital SQL) is correct
    const AdapterClass = adapterModule.PrismaLibSQL || adapterModule.PrismaLibSql || adapterModule.default;
    diagnostics.adapterClassFound = !!AdapterClass;
    diagnostics.adapterClassName = AdapterClass?.name || 'unknown';
    
    if (AdapterClass) {
      const { createClient } = require('@libsql/client');
      const { PrismaClient } = require('@prisma/client');
      
      const libsql = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      });
      
      diagnostics.libsqlClient = 'CREATED';
      
      const adapter = new AdapterClass(libsql);
      diagnostics.adapterCreated = 'SUCCESS';
      
      const prisma = new PrismaClient({ adapter } as any);
      diagnostics.prismaClient = 'CREATED';
      
      const count = await prisma.user.count();
      diagnostics.prismaConnection = 'SUCCESS';
      diagnostics.prismaUserCount = count;

      // Test Store query (the failing query from dashboard)
      try {
        const stores = await prisma.store.findMany({
          take: 2,
          select: { id: true, tempName: true, createdAt: true }
        });
        diagnostics.storeQuery = 'SUCCESS';
        diagnostics.storeCount = stores.length;
        diagnostics.storeSample = stores.map((s: { id: string; tempName: string | null; createdAt: Date }) => ({
          id: s.id,
          tempName: s.tempName,
          createdAt: s.createdAt?.toISOString?.() || String(s.createdAt)
        }));
      } catch (storeError: any) {
        diagnostics.storeQuery = 'FAILED';
        diagnostics.storeError = storeError.message;
      }
    }
  } catch (e: any) {
    diagnostics.prismaConnection = 'FAILED';
    diagnostics.prismaError = e.message;
    diagnostics.prismaStack = e.stack?.split('\n').slice(0, 5);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
