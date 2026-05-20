import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-shot setup endpoint:
 *  - Memastikan semua enum value yang dipakai schema saat ini ada di DB
 *    (penting kalau DB Supabase punya enum lama, mis. lowercase).
 *  - Membuat/upsert akun Administrator dari ADMIN_EMAIL & ADMIN_PASSWORD env.
 *
 * Auth: Bearer token = ADMIN_PASSWORD (atau body { token: ADMIN_PASSWORD }).
 * Idempotent: aman dijalankan berkali-kali.
 */

const ENUMS: Record<string, string[]> = {
  Role: ["ADMIN", "KAPRODI", "DOSEN", "MAHASISWA"],
  LetterType: [
    "AKTIF_KULIAH",
    "IZIN_PENELITIAN",
    "CUTI_AKADEMIK",
    "PENGANTAR_SKPI",
    "BEBAS_PLAGIASI",
  ],
  RequestStatus: [
    "DRAFT",
    "SUBMITTED",
    "VERIFIED",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
  ],
  TesisStage: [
    "JUDUL",
    "PROPOSAL",
    "SEMINAR_PROPOSAL",
    "BIMBINGAN",
    "KUT",
    "SIDANG",
    "REVISI",
    "SELESAI",
  ],
  SidangResult: ["BELUM", "LULUS", "LULUS_DENGAN_REVISI", "TIDAK_LULUS"],
  SidangMode: ["OFFLINE", "ONLINE"],
  DocumentKind: [
    "SURAT",
    "SK_PEMBIMBING",
    "SK_SIDANG",
    "UNDANGAN_SEMINAR",
    "UNDANGAN_SIDANG",
    "BERITA_ACARA_SEMINAR",
    "BERITA_ACARA_SIDANG",
    "LEMBAR_PENGESAHAN",
    "LAINNYA",
  ],
};

function authorized(req: Request, bodyToken?: string) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  const auth = req.headers.get("authorization") || "";
  const headerToken = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  return headerToken === expected || bodyToken === expected;
}

export async function POST(req: Request) {
  let body: { token?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (!authorized(req, body.token)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Unauthorized. Kirim token = nilai ADMIN_PASSWORD (Bearer header atau body.token).",
      },
      { status: 401 },
    );
  }

  const steps: Array<{
    step: string;
    ok: boolean;
    detail?: string;
  }> = [];

  // 1. Pastikan semua enum value tersedia di DB (idempotent).
  for (const [enumName, values] of Object.entries(ENUMS)) {
    for (const v of values) {
      try {
        // ALTER TYPE ... ADD VALUE IF NOT EXISTS aman dijalankan berulang.
        // Tidak bisa di dalam explicit transaction block.
        await prisma.$executeRawUnsafe(
          `ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${v.replace(/'/g, "''")}'`,
        );
        steps.push({ step: `enum ${enumName}.${v}`, ok: true });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        // Kalau type-nya sendiri belum ada, ini akan error -- biarkan dan teruskan.
        steps.push({
          step: `enum ${enumName}.${v}`,
          ok: false,
          detail: msg,
        });
      }
    }
  }

  // 2. Upsert admin user dari env.
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (!adminEmail || !adminPassword) {
    steps.push({
      step: "create-admin",
      ok: false,
      detail: "ADMIN_EMAIL atau ADMIN_PASSWORD belum di-set di env.",
    });
    return NextResponse.json({ ok: false, steps }, { status: 200 });
  }
  try {
    const hashed = await hashPassword(adminPassword);
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: "ADMIN",
        isActive: true,
        hashedPassword: hashed,
      },
      create: {
        email: adminEmail,
        nimNip: "ADM-0001",
        name: "Administrator",
        hashedPassword: hashed,
        role: "ADMIN",
        isActive: true,
      },
      select: { id: true, email: true, role: true, isActive: true },
    });
    steps.push({
      step: "create-admin",
      ok: true,
      detail: `email=${user.email} role=${user.role} active=${user.isActive}`,
    });
    return NextResponse.json({ ok: true, steps }, { status: 200 });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    steps.push({
      step: "create-admin",
      ok: false,
      detail: `${err.code || ""} ${err.message || String(e)}`.trim(),
    });
    return NextResponse.json({ ok: false, steps }, { status: 500 });
  }
}
