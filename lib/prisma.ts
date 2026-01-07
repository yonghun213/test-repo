import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
  var prismaInitialized: boolean | undefined;
}

function createPrismaClient(): PrismaClient {
  // Check if we're in production AND have Turso credentials
  const isProduction = process.env.NODE_ENV === 'production';
  const hasTursoCredentials = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;
  
  if (isProduction && hasTursoCredentials) {
    try {
      // Dynamic require to avoid build-time issues
      const { PrismaLibSql } = require('@prisma/adapter-libsql');
      const { createClient } = require('@libsql/client');
      
      const libsql = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      const adapter = new PrismaLibSql(libsql);
      return new PrismaClient({ adapter } as any);
    } catch (e) {
      console.error('Failed to initialize Turso adapter:', e);
      return new PrismaClient();
    }
  }
  
  // Development: Use local SQLite
  return new PrismaClient();
}

// Lazy initialization
let _prisma: PrismaClient | undefined;

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) {
      if (process.env.NODE_ENV !== 'production' && global.prisma) {
        _prisma = global.prisma;
      } else {
        _prisma = createPrismaClient();
        if (process.env.NODE_ENV !== 'production') {
          global.prisma = _prisma;
        }
      }
    }
    return (_prisma as any)[prop];
  }
});
