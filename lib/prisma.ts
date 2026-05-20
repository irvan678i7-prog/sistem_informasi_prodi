import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * Connection strings are configured in prisma/schema.prisma via:
 *   - DATABASE_URL  -> pooled connection (Supabase pooler, port 6543) used at runtime
 *   - DIRECT_URL    -> direct connection (Supabase db.<ref>.supabase.co:5432)
 *                       used by `prisma migrate` / `prisma db push`
 *
 * For Supabase, append `?pgbouncer=true&connection_limit=1` to DATABASE_URL.
 * See SETUP.md.
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
