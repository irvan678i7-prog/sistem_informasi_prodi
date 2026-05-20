import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint diagnostik: cek koneksi DB & ketersediaan tabel inti.
 * Aman diekspos publik karena tidak mengembalikan secret/connection string,
 * hanya status & nama error class.
 */
export async function GET() {
  const result: {
    ok: boolean;
    env: { DATABASE_URL: boolean; DIRECT_URL: boolean; JWT_SECRET: boolean };
    canConnect: boolean;
    userTableExists: boolean;
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

  // 1. Coba koneksi sederhana.
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
    } else if (/prepared statement/i.test(err.message || "")) {
      result.hint =
        "DATABASE_URL belum pakai pooler. Tambahkan ?pgbouncer=true&connection_limit=1 di akhir URL dan pakai port 6543 (host pooler.supabase.com).";
    }
    return NextResponse.json(result, { status: 500 });
  }

  // 2. Cek tabel User & jumlah admin.
  try {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    result.userTableExists = true;
    result.adminCount = adminCount;
    if (adminCount === 0) {
      result.hint =
        "Tabel User ada tapi belum ada admin. Jalankan seed: `npm run db:seed` (lokal, dengan .env mengarah ke DB production).";
      result.ok = false;
      return NextResponse.json(result, { status: 200 });
    }
    result.ok = true;
    return NextResponse.json(result, { status: 200 });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    result.error = err.message || String(e);
    result.errorCode = err.code || null;
    if (
      err.code === "P2021" ||
      /relation .* does not exist/i.test(err.message || "")
    ) {
      result.hint =
        "Tabel belum dibuat di DB production. Jalankan dari lokal (dengan .env mengarah ke DB production): `npm run db:push` lalu `npm run db:seed`.";
    }
    return NextResponse.json(result, { status: 500 });
  }
}
