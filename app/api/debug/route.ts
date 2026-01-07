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
    // Test Prisma with detailed error
    const { createClient } = require('@libsql/client');
    const { PrismaLibSql } = require('@prisma/adapter-libsql');
    const { PrismaClient } = require('@prisma/client');
    
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    
    diagnostics.libsqlClient = 'CREATED';
    
    const adapter = new PrismaLibSql(libsql);
    diagnostics.adapterCreated = 'SUCCESS';
    
    const prisma = new PrismaClient({ adapter } as any);
    diagnostics.prismaClient = 'CREATED';
    
    const count = await prisma.user.count();
    diagnostics.prismaConnection = 'SUCCESS';
    diagnostics.prismaUserCount = count;
  } catch (e: any) {
    diagnostics.prismaConnection = 'FAILED';
    diagnostics.prismaError = e.message;
    diagnostics.prismaStack = e.stack?.split('\n').slice(0, 5);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
