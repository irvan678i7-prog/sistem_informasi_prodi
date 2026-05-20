import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint diagnostik: cek koneksi DB & ketersediaan tabel + enum.
 * Aman diekspos publik karena tidak mengembalikan secret/connection string.
 *
 * Memakai raw SQL biar tidak ikut gagal kalau enum di DB belum match
 * dengan enum di Prisma client.
 */
export async function GET() {
  type RoleEnumRow = { value: string };
  type CountRow = { count: bigint | number };
  type RoleAggRow = { role: string; count: bigint | number };

  const result: {
    ok: boolean;
    env: { DATABASE_URL: boolean; DIRECT_URL: boolean; JWT_SECRET: boolean };
    canConnect: boolean;
    userTableExists: boolean;
    roleEnumValues: string[] | null;
    userCountTotal: number | null;
    userCountByRole: Array<{ role: string; count: number }> | null;
    adminCount: number | null;
    error: string | null;
    errorCode: string | null;
    hint: string | null;
  } = {
    ok: false,
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
    },
    canConnect: false,
    userTableExists: false,
    roleEnumValues: null,
    userCountTotal: null,
    userCountByRole: null,
    adminCount: null,
    error: null,
    errorCode: null,
    hint: null,
  };

  if (!result.env.DATABASE_URL) {
    result.error = "DATABASE_URL tidak ter-set di environment.";
    result.hint =
      "Tambahkan DATABASE_URL di Vercel Project Settings -> Environment Variables, lalu Redeploy.";
    return NextResponse.json(result, { status: 500 });
  }

  // 1. Tes koneksi.
  try {
    await prisma.$queryRaw`SELECT 1`;
    result.canConnect = true;
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; name?: string };
    result.error = err.message || String(e);
    result.errorCode = err.code || err.name || null;
    if (
      err.code === "P1001" ||
      /can'?t reach database/i.test(err.message || "")
    ) {
      result.hint =
        "Tidak bisa menjangkau database. Cek host/port/password di DATABASE_URL. Pastikan Supabase project tidak paused.";
    } else if (/password authentication/i.test(err.message || "")) {
      result.hint =
        "Password DB salah. Update DATABASE_URL & DIRECT_URL dengan password yang benar (URL-encode jika ada karakter spesial).";
    }
    return NextResponse.json(result, { status: 500 });
  }

  // 2. Ambil daftar nilai enum Role yang aktual ada di DB.
  try {
    const rows = await prisma.$queryRawUnsafe<RoleEnumRow[]>(
      `SELECT e.enumlabel AS value
         FROM pg_type t
         JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'Role'
        ORDER BY e.enumsortorder`,
    );
    result.roleEnumValues = rows.map((r) => r.value);
  } catch (e: unknown) {
    // Tipe enum belum ada -> berarti schema belum di-push sama sekali.
    result.roleEnumValues = [];
    const err = e as { message?: string };
    if (
      /does not exist/i.test(err.message || "") ||
      /could not find/i.test(err.message || "")
    ) {
      result.hint =
        "Tipe enum 'Role' belum ada. Jalankan `npx prisma db push` (lokal, dengan .env mengarah ke DB production) untuk bikin schemanya.";
      result.error = err.message || String(e);
      return NextResponse.json(result, { status: 500 });
    }
  }

  // 3. Cek tabel User pakai raw SQL (biar tidak gagal di enum mismatch).
  try {
    const totalRows = await prisma.$queryRawUnsafe<CountRow[]>(
      `SELECT COUNT(*)::int AS count FROM "User"`,
    );
    result.userTableExists = true;
    result.userCountTotal = Number(totalRows[0]?.count ?? 0);

    const byRole = await prisma.$queryRawUnsafe<RoleAggRow[]>(
      `SELECT role::text AS role, COUNT(*)::int AS count
         FROM "User"
        GROUP BY role::text
        ORDER BY role::text`,
    );
    result.userCountByRole = byRole.map((r) => ({
      role: r.role,
      count: Number(r.count),
    }));

    const adminAgg = byRole.find((r) => r.role === "ADMIN");
    result.adminCount = adminAgg ? Number(adminAgg.count) : 0;
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    result.error = err.message || String(e);
    result.errorCode = err.code || null;
    if (
      err.code === "P2021" ||
      /relation .* does not exist/i.test(err.message || "")
    ) {
      result.hint =
        "Tabel 'User' belum dibuat di DB. Jalankan dari lokal (dengan .env mengarah ke DB production): `npm run db:push` lalu `npm run db:seed`.";
    }
    return NextResponse.json(result, { status: 500 });
  }

  // 4. Beri hint berdasarkan kondisi.
  const enumHasAdmin = (result.roleEnumValues || []).includes("ADMIN");
  if (!enumHasAdmin) {
    result.hint =
      "Enum 'Role' di DB tidak punya nilai 'ADMIN'. Buka /admin/setup, masukkan ADMIN_PASSWORD, klik 'Jalankan Setup'. Enum value ada saat ini: " +
      JSON.stringify(result.roleEnumValues);
    return NextResponse.json(result, { status: 200 });
  }
  if (!result.adminCount || result.adminCount === 0) {
    result.hint =
      "Enum sudah benar tapi belum ada user dengan role ADMIN. Buka /admin/setup, klik Jalankan Setup untuk membuat admin dari ADMIN_EMAIL/ADMIN_PASSWORD.";
    return NextResponse.json(result, { status: 200 });
  }

  result.ok = true;
  return NextResponse.json(result, { status: 200 });
}
