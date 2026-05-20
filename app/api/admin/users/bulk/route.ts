import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

const RowSchema = z.object({
  nim: z.string().trim().min(2),
  name: z.string().trim().min(2),
  email: z.string().trim().email().optional().or(z.literal("")),
  prodiCode: z.string().trim().optional().or(z.literal("")),
  prodiId: z.string().trim().optional().or(z.literal("")),
  angkatan: z.union([z.string(), z.number()]).optional().nullable(),
  semester: z.union([z.string(), z.number()]).optional().nullable(),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

const Body = z.object({
  rows: z.array(RowSchema).min(1).max(2000),
  // Kalau true, baris dengan NIM yang sudah ada akan di-update (mis. nama berubah).
  // Kalau false (default), baris dengan NIM yang sudah ada akan dilewati.
  upsert: z.boolean().optional(),
  // Default prodiId untuk baris yang tidak isi prodiCode/prodiId.
  defaultProdiId: z.string().trim().optional().or(z.literal("")),
});

type Row = z.infer<typeof RowSchema>;

/**
 * Bulk upload mahasiswa.
 *
 * - Username (nimNip) dan email = sesuai data.
 * - Password awal = sama dengan NIM (di-hash bcrypt).
 * - Email opsional: kalau kosong, dibuat dari NIM ({NIM}@mhs.ummetro.ac.id).
 * - Prodi: bisa lewat prodiCode (lebih user-friendly), prodiId, atau defaultProdiId.
 * - Tesis row otomatis dibuat untuk setiap mahasiswa baru.
 *
 * Hasil: { created, updated, skipped, errors[] }.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const upsert = parsed.upsert ?? false;
  const defaultProdiId = parsed.defaultProdiId || null;

  // Pre-fetch prodi lookup by code (one query).
  const prodiList = await prisma.prodi.findMany({
    select: { id: true, code: true },
  });
  const prodiByCode = new Map(prodiList.map((p) => [p.code.toLowerCase(), p.id]));
  const prodiIds = new Set(prodiList.map((p) => p.id));

  const errors: Array<{ row: number; nim?: string; message: string }> = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < parsed.rows.length; i++) {
    const idx = i + 1; // 1-indexed for human-friendly errors
    const r: Row = parsed.rows[i];

    const nim = r.nim.trim();
    const name = r.name.trim();
    if (!nim || !name) {
      errors.push({ row: idx, nim, message: "NIM atau nama kosong" });
      continue;
    }

    let prodiId: string | null = null;
    if (r.prodiId && prodiIds.has(r.prodiId)) {
      prodiId = r.prodiId;
    } else if (r.prodiCode) {
      prodiId = prodiByCode.get(r.prodiCode.toLowerCase()) || null;
      if (!prodiId) {
        errors.push({
          row: idx,
          nim,
          message: `Prodi code "${r.prodiCode}" tidak ditemukan`,
        });
        continue;
      }
    } else if (defaultProdiId && prodiIds.has(defaultProdiId)) {
      prodiId = defaultProdiId;
    }

    const email =
      (r.email && r.email.trim()) || `${nim}@mhs.ummetro.ac.id`;
    const angkatan = numOrNull(r.angkatan) ?? new Date().getFullYear();
    const semester = numOrNull(r.semester) ?? 1;

    try {
      // Cari user lama by NIM atau email.
      const existing = await prisma.user.findFirst({
        where: { OR: [{ nimNip: nim }, { email }] },
        select: { id: true, role: true },
      });

      if (existing && !upsert) {
        skipped += 1;
        continue;
      }

      // Password awal = NIM (di-hash baru kalau create / kalau upsert).
      const hashedPassword = await hashPassword(nim);

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            email: email.toLowerCase(),
            nimNip: nim,
            role: "MAHASISWA",
            isActive: true,
            prodiId,
            phone: r.phone || null,
            address: r.address || null,
            hashedPassword,
            mahasiswaProfile: {
              upsert: {
                create: { angkatan, semester },
                update: { angkatan, semester },
              },
            },
          },
        });
        await prisma.tesis
          .upsert({
            where: { mahasiswaId: existing.id },
            update: {},
            create: { mahasiswaId: existing.id },
          })
          .catch(() => undefined);
        updated += 1;
      } else {
        const u = await prisma.user.create({
          data: {
            name,
            email: email.toLowerCase(),
            nimNip: nim,
            role: "MAHASISWA",
            prodiId,
            hashedPassword,
            phone: r.phone || null,
            address: r.address || null,
            mahasiswaProfile: { create: { angkatan, semester } },
          },
        });
        await prisma.tesis.create({ data: { mahasiswaId: u.id } });
        created += 1;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ row: idx, nim, message: msg });
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "USER_BULK_UPLOAD",
      entity: "User",
      metadata: {
        total: parsed.rows.length,
        created,
        updated,
        skipped,
        errorCount: errors.length,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    total: parsed.rows.length,
    created,
    updated,
    skipped,
    errors,
  });
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
