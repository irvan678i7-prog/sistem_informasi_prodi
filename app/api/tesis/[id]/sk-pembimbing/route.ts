import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { signDocument } from "@/lib/sign";
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
  if (
    session.role !== "KAPRODI" &&
    session.role !== "WAKIL_DIREKTUR" &&
    session.role !== "DIREKTUR" &&
    session.role !== "ADMIN_SISTEM"
  )
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

  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const count = await prisma.signedDocument.count({
    where: { kind: "SK_PEMBIMBING", signedAt: { gte: yearStart } },
  });
  const nomor = generateLetterNumber(count + 1, "II.3.AU/SK.PPs");

  const signer = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!signer)
    return NextResponse.json({ message: "Signer tidak valid" }, { status: 400 });

  const [p1, p2] = await Promise.all([
    prisma.user.findUnique({ where: { id: parsed.pembimbing1Id } }),
    parsed.pembimbing2Id
      ? prisma.user.findUnique({ where: { id: parsed.pembimbing2Id } })
      : Promise.resolve(null),
  ]);

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
