import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkBulkRows, toClientRow } from "@/lib/bulkPembimbing";

const Body = z.object({
  rows: z
    .array(
      z.object({
        nim: z.string().trim().min(1).max(50),
        nama: z.string().trim().max(200).default(""),
        p1: z.string().trim().max(200).default(""),
        p2: z.string().trim().max(200).default(""),
      }),
    )
    .min(1)
    .max(500),
});

/**
 * Simpan bulk assign Pembimbing 1 & 2 (Kaprodi/Admin) SETELAH user
 * mengonfirmasi preview. Baris divalidasi ulang di server; hanya baris
 * berstatus ok yang disimpan. Bulk upload tidak menerbitkan SK otomatis.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "KAPRODI" && session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { prodiId: true },
  });
  const kaprodiProdiId =
    session.role === "KAPRODI" ? (me?.prodiId ?? null) : null;

  const checks = await checkBulkRows(parsed.rows, kaprodiProdiId);

  let updated = 0;
  for (const c of checks) {
    if (c.status !== "ok" || !c.tesisId || !c.p1Id || !c.mahasiswaId) continue;

    await prisma.tesis.update({
      where: { id: c.tesisId },
      data: {
        pembimbing1Id: c.p1Id,
        pembimbing2Id: c.p2Id ?? null,
        ...(c.tesisStage === "JUDUL" ? { stage: "PROPOSAL" as const } : {}),
      },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: c.mahasiswaId,
          title: "Pembimbing Ditetapkan",
          body: `Pembimbing tesis Anda telah ditetapkan. ${c.message}.`,
          link: "/tesis",
        },
        {
          userId: c.p1Id,
          title: "Penugasan Pembimbing 1",
          body: `Anda ditetapkan sebagai Pembimbing 1 untuk ${c.nama} (${c.nim}).`,
          link: "/dashboard",
        },
        ...(c.p2Id
          ? [
              {
                userId: c.p2Id,
                title: "Penugasan Pembimbing 2",
                body: `Anda ditetapkan sebagai Pembimbing 2 untuk ${c.nama} (${c.nim}).`,
                link: "/dashboard",
              },
            ]
          : []),
      ],
    });

    updated++;
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_PEMBIMBING_BULK_ASSIGN",
      entity: "Tesis",
      metadata: { updated, total: parsed.rows.length },
    },
  });

  return NextResponse.json({
    ok: true,
    updated,
    results: checks.map(toClientRow),
  });
}
