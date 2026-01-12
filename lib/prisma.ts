import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

function createDisabledPrismaClient(): PrismaClient {
  return new Proxy(
    {},
    {
      get() {
        const error = new Error(
          'Database is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your environment.'
        );
        (error as any).code = 'DB_NOT_CONFIGURED';
        throw error;
      },
    }
  ) as PrismaClient;
}

function createPrismaClient(): PrismaClient {
  // Skip Turso during build time
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
  const hasTursoCredentials = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;
  
  if (!isBuildTime && hasTursoCredentials) {
    console.log('Initializing Prisma with Turso adapter...');
    try {
      // Create libsql client first, then pass to adapter
      const { createClient } = require('@libsql/client');
      const { PrismaLibSQL } = require('@prisma/adapter-libsql');
      
      const libsql = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      });
      
      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({ adapter } as any);
    } catch (e) {
      console.error('Failed to create Turso adapter:', e);
      throw e; // Don't fallback to SQLite - it won't work on Vercel
    }
  }

  if (!isBuildTime && process.env.NODE_ENV === 'production' && !hasTursoCredentials) {
    return createDisabledPrismaClient();
  }
  
  // Local development or build time: Use SQLite
  console.log('Initializing Prisma with local SQLite...');
  return new PrismaClient();
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
