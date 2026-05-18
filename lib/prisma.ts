import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * Connection strings are configured in prisma/schema.prisma via:
 *   - DATABASE_URL  -> pooled connection (Neon "-pooler" host) used at runtime
 *   - DIRECT_URL    -> direct connection used by `prisma migrate` / `prisma db push`
 *
 * For Neon, ensure DATABASE_URL includes `?sslmode=require&pgbouncer=true`
 * and DIRECT_URL includes `?sslmode=require`. See SETUP.md.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
