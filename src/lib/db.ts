import { PrismaClient } from '../generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Direct database URL from environment or fallback
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

// Instantiate the SQLite driver adapter directly with the URL configuration
const adapter = new PrismaBetterSqlite3({
  url: dbUrl,
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
