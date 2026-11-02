import path from 'node:path';
import { PrismaClient } from '../generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

function getResolvedDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL || 'file:./dev.db';
  if (rawUrl.startsWith('file:')) {
    const filePath = rawUrl.slice(5);
    if (!path.isAbsolute(filePath)) {
      // Find project root based on this file's location (src/lib -> ../..)
      const projectRoot = path.resolve(__dirname, '..', '..');
      return `file:${path.resolve(projectRoot, filePath)}`;
    }
  }
  return rawUrl;
}

const dbUrl = getResolvedDatabaseUrl();

// Instantiate the SQLite driver adapter directly with the URL configuration
const adapter = new PrismaBetterSqlite3({
  url: dbUrl,
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
