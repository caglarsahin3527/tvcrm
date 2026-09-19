import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getSafeDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url) return undefined;

  // For Supabase Pooler (pooler.supabase.com), ALWAYS use Transaction Mode (port 6543) with pgbouncer=true & connection_limit=1
  // This avoids the FATAL: (EMAXCONNSESSION) max clients reached in session mode (limited to 15) error.
  if (url.includes('pooler.supabase.com')) {
    if (url.includes(':5432')) {
      url = url.replace(':5432', ':6543');
    }
    if (!url.includes('pgbouncer=true')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}pgbouncer=true`;
    }
    if (!url.includes('connection_limit=')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}connection_limit=1`;
    }
  }

  return url;
}

const safeUrl = getSafeDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: safeUrl ? { db: { url: safeUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;

