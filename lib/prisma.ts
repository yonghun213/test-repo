import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  // Skip Turso during build time
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;
  const hasTursoCredentials = !!(tursoUrl && tursoAuthToken);
  
  if (!isBuildTime && hasTursoCredentials) {
    console.log('Initializing Prisma with Turso adapter...');
    try {
      // Create libsql client first, then pass to adapter
      const { createClient } = require('@libsql/client');
      const { PrismaLibSQL } = require('@prisma/adapter-libsql');
      
      const libsql = createClient({
        url: tursoUrl!,
        authToken: tursoAuthToken!,
      });
      
      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({ adapter } as any);
    } catch (e) {
      console.error('Failed to create Turso adapter:', e);
      throw e; // Don't fallback to SQLite - it won't work on Vercel
    }
  }

  if (process.env.NODE_ENV === 'production' && !isBuildTime) {
    throw new Error(
      'Missing Turso database credentials. Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (or DATABASE_URL + DATABASE_AUTH_TOKEN).'
    );
  }
  
  // Local development or build time: Use SQLite
  console.log('Initializing Prisma with local SQLite...');
  return new PrismaClient();
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
