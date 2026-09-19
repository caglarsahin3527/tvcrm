import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getSafeDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url) return undefined;
  if (url.includes(':6543')) {
    url = url.replace(':6543', ':5432').replace('?pgbouncer=true', '?connect_timeout=30').replace('&pgbouncer=true', '');
  }
  return url;
}

const safeUrl = getSafeDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: safeUrl ? { db: { url: safeUrl } } : undefined,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
