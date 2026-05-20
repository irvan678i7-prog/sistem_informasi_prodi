import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-shot setup endpoint.
 *
 *  - Memastikan semua enum value yang dipakai schema saat ini ada di DB
 *    (penting kalau DB Supabase punya enum lama, mis. lowercase 'admin').
 *  - Menormalisasi nilai enum kolom Role lama (lowercase) -> uppercase
 *    sesuai schema sekarang.
 *  - Membuat / upsert akun Administrator dari ADMIN_EMAIL & ADMIN_PASSWORD.
 *
 * PENTING: ALTER TYPE ... ADD VALUE tidak boleh dijalankan via PgBouncer
 * (transaction pooler, port 6543 di Supabase). Karena itu, untuk DDL kita
 * pakai connection langsung lewat DIRECT_URL (port 5432).
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

// Tabel & kolom yang nilai enum-nya perlu di-uppercase kalau ada data lama.
const ROLE_COLUMNS: Array<{ table: string; column: string }> = [
  { table: "User", column: "role" },
  { table: "SignedDocument", column: "signerRole" },
];

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

  const steps: Array<{ step: string; ok: boolean; detail?: string }> = [];

  // Gunakan koneksi langsung (bukan pooler) untuk DDL.
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!directUrl) {
    steps.push({
      step: "check-env",
      ok: false,
      detail: "DIRECT_URL/DATABASE_URL belum di-set.",
    });
    return NextResponse.json({ ok: false, steps }, { status: 500 });
  }

  const directPrisma = new PrismaClient({
    datasources: { db: { url: directUrl } },
    log: ["error"],
  });

  try {
    // 1) Tambah enum value yang hilang (idempotent).
    for (const [enumName, values] of Object.entries(ENUMS)) {
      for (const v of values) {
        try {
          await directPrisma.$executeRawUnsafe(
            `ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${v.replace(/'/g, "''")}'`,
          );
          steps.push({ step: `enum ${enumName}.${v}`, ok: true });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          steps.push({
            step: `enum ${enumName}.${v}`,
            ok: false,
            detail: msg,
          });
        }
      }
    }

    // 2) Normalisasi nilai role lama (lowercase) -> uppercase.
    //    Aman: cuma update kalau ada baris yang nilainya bukan uppercase.
    for (const { table, column } of ROLE_COLUMNS) {
      try {
        const updated = await directPrisma.$executeRawUnsafe(
          `UPDATE "${table}" SET "${column}" = UPPER("${column}"::text)::"Role" WHERE "${column}"::text <> UPPER("${column}"::text)`,
        );
        steps.push({
          step: `normalize ${table}.${column}`,
          ok: true,
          detail: `${updated} baris di-update`,
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        // Kalau tabel/kolom tidak ada, skip saja.
        steps.push({
          step: `normalize ${table}.${column}`,
          ok: false,
          detail: msg,
        });
      }
    }

    // 3) Map nilai role yang TIDAK dikenal schema (mis. 'DIREKTUR' lama)
    //    ke 'ADMIN' supaya Prisma client bisa membaca semua row.
    const validRoles = ENUMS.Role; // ["ADMIN","KAPRODI","DOSEN","MAHASISWA"]
    const validList = validRoles.map((r) => `'${r}'`).join(", ");
    for (const { table, column } of ROLE_COLUMNS) {
      try {
        const updated = await directPrisma.$executeRawUnsafe(
          `UPDATE "${table}" SET "${column}" = 'ADMIN'::"Role" WHERE "${column}"::text NOT IN (${validList})`,
        );
        steps.push({
          step: `map-unknown-roles ${table}.${column}`,
          ok: true,
          detail: `${updated} baris dengan role tidak dikenal -> ADMIN`,
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        steps.push({
          step: `map-unknown-roles ${table}.${column}`,
          ok: false,
          detail: msg,
        });
      }
    }
  } finally {
    await directPrisma.$disconnect().catch(() => undefined);
  }

  // 3) Upsert admin via koneksi pooler biasa.
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
