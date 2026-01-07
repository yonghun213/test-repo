import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  // Production (Vercel): Use Turso (LibSQL)
  if (process.env.NODE_ENV === 'production' && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    // Dynamic import for production only
    const { PrismaLibSql } = require('@prisma/adapter-libsql');
    const { createClient } = require('@libsql/client');
    
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({ adapter });
  }
  
  // Development: Use local SQLite
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
