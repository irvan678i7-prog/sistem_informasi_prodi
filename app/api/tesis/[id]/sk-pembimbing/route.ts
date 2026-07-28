import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { signDocument } from "@/lib/sign";
import { nextSequence } from "@/lib/sequence";
import { generateLetterNumber } from "@/lib/utils";

const Body = z.object({
  pembimbing1Id: z.string().min(1),
  pembimbing2Id: z.string().min(1).nullable().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "KAPRODI")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const { id } = await ctx.params;
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const tesis = await prisma.tesis.findUnique({
    where: { id },
    include: { mahasiswa: { include: { prodi: true } } },
  });
  if (!tesis) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  // Pembimbing hanya boleh ditetapkan setelah judul difinalisasi (ACC).
  if (tesis.judulStatus !== "APPROVED")
    return NextResponse.json(
      {
        message:
          "Judul belum difinalisasi Kaprodi. Tetapkan pembimbing setelah judul di-ACC.",
      },
      { status: 409 },
    );

  const signer = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!signer)
    return NextResponse.json({ message: "Signer tidak valid" }, { status: 400 });

  const [p1, p2] = await Promise.all([
    prisma.user.findUnique({ where: { id: parsed.pembimbing1Id } }),
    parsed.pembimbing2Id
      ? prisma.user.findUnique({ where: { id: parsed.pembimbing2Id } })
      : Promise.resolve(null),
  ]);

  // Validasi peran pembimbing (route lama ini sebelumnya tidak mengecek peran,
  // sehingga user sembarang bisa ditetapkan jadi pembimbing).
  if (!p1 || !["DOSEN", "KAPRODI"].includes(p1.role))
    return NextResponse.json(
      { message: "Pembimbing 1 tidak valid" },
      { status: 400 },
    );
  if (parsed.pembimbing2Id && (!p2 || !["DOSEN", "KAPRODI"].includes(p2.role)))
    return NextResponse.json(
      { message: "Pembimbing 2 tidak valid" },
      { status: 400 },
    );
  if (parsed.pembimbing2Id && parsed.pembimbing2Id === parsed.pembimbing1Id)
    return NextResponse.json(
      { message: "Pembimbing 1 dan 2 tidak boleh sama" },
      { status: 400 },
    );

  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const count = await prisma.signedDocument.count({
    where: { kind: "SK_PEMBIMBING", signedAt: { gte: yearStart } },
  });
  // Counter atomik (lihat lib/sequence.ts) untuk cegah nomor SK kembar.
  const seq = (await nextSequence(`sk_pembimbing:${year}`, count)) ?? count + 1;
  const nomor = generateLetterNumber(seq, "II.3.AU/SK.PPs");

  const doc = await signDocument({
    kind: "SK_PEMBIMBING",
    nomor,
    payload: {
      tesisId: tesis.id,
      mahasiswa: {
        name: tesis.mahasiswa.name,
        nimNip: tesis.mahasiswa.nimNip,
        prodi: tesis.mahasiswa.prodi?.name,
      },
      judul: tesis.judulFinal,
      pembimbing1: p1?.name,
      pembimbing2: p2?.name,
    },
    signer,
  });

  await prisma.tesis.update({
    where: { id },
    data: {
      pembimbing1Id: parsed.pembimbing1Id,
      pembimbing2Id: parsed.pembimbing2Id || null,
      skBimbinganNo: nomor,
      skBimbinganDocId: doc.id,
      stage: "PROPOSAL",
      timeline: {
        create: {
          stage: "SK_PEMBIMBING_ISSUED",
          note: `SK Pembimbing terbit: ${nomor}`,
          actorId: session.uid,
        },
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: tesis.mahasiswaId,
        title: "SK Pembimbing Terbit",
        body: `SK Pembimbing Anda telah diterbitkan (${nomor}).`,
        link: `/tesis`,
      },
      {
        userId: parsed.pembimbing1Id,
        title: "Penugasan Pembimbing 1",
        body: `Anda ditetapkan sebagai Pembimbing 1 untuk ${tesis.mahasiswa.name}.`,
        link: `/bimbingan`,
      },
      ...(parsed.pembimbing2Id
        ? [
            {
              userId: parsed.pembimbing2Id,
              title: "Penugasan Pembimbing 2",
              body: `Anda ditetapkan sebagai Pembimbing 2 untuk ${tesis.mahasiswa.name}.`,
              link: `/bimbingan`,
            },
          ]
        : []),
    ],
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_SK_PEMBIMBING",
      entity: "Tesis",
      entityId: id,
      metadata: { nomor },
    },
  });
  return NextResponse.json({ ok: true, nomor, code: doc.code });
}
