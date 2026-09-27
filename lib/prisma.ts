import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in the environment variables.');
}

// Clean connectionString by stripping surrounding quotes if they exist
if (
  (connectionString.startsWith('"') && connectionString.endsWith('"')) ||
  (connectionString.startsWith("'") && connectionString.endsWith("'"))
) {
  connectionString = connectionString.substring(1, connectionString.length - 1);
  process.env.DATABASE_URL = connectionString;
}

// Pass connection string options directly to PrismaNeon in Prisma 7
const adapter = new PrismaNeon({ connectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
