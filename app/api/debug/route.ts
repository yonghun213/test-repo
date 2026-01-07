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
    diagnostics.userCount = result.rows[0]?.count;
  } catch (e: any) {
    diagnostics.tursoConnection = 'FAILED';
    diagnostics.tursoError = e.message;
  }

  try {
    // Check what's exported from adapter-libsql
    const adapterModule = require('@prisma/adapter-libsql');
    diagnostics.adapterExports = Object.keys(adapterModule);
    diagnostics.PrismaLibSqlType = typeof adapterModule.PrismaLibSql;
    
    // Try different export names
    const AdapterClass = adapterModule.PrismaLibSql || adapterModule.LibSQLAdapter || adapterModule.default;
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
    }
  } catch (e: any) {
    diagnostics.prismaConnection = 'FAILED';
    diagnostics.prismaError = e.message;
    diagnostics.prismaStack = e.stack?.split('\n').slice(0, 5);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
