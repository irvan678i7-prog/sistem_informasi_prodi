import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canApproveLetter } from "@/lib/rbac";
import { signDocument } from "@/lib/sign";
import { generateLetterNumber } from "@/lib/utils";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (!canApproveLetter(session.role))
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const { id } = await ctx.params;
  const letter = await prisma.letterRequest.findUnique({
    where: { id },
    include: { mahasiswa: { include: { prodi: true } } },
  });
  if (!letter) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
  if (letter.status !== "APPROVED")
    return NextResponse.json({ message: "Surat belum disetujui" }, { status: 400 });

  // Generate nomor urut tahun ini per type
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const count = await prisma.letterRequest.count({
    where: { type: letter.type, nomor: { not: null }, createdAt: { gte: yearStart } },
  });
  const seq = count + 1;
  const nomor = generateLetterNumber(seq);

  const signer = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!signer)
    return NextResponse.json({ message: "Signer tidak valid" }, { status: 400 });

  const doc = await signDocument({
    kind: "SURAT",
    nomor,
    payload: {
      letterId: letter.id,
      type: letter.type,
      mahasiswa: {
        name: letter.mahasiswa.name,
        nimNip: letter.mahasiswa.nimNip,
        prodi: letter.mahasiswa.prodi?.name,
      },
      payload: letter.payload,
      signedAt: new Date().toISOString(),
    },
    signer,
  });

  await prisma.letterRequest.update({
    where: { id },
    data: {
      status: "COMPLETED",
      nomor,
      signedDocId: doc.id,
      timeline: {
        create: {
          stage: "COMPLETED",
          note: `Diterbitkan & ditandatangani elektronik (${nomor})`,
          actorId: session.uid,
        },
      },
    },
  });
  await prisma.notification.create({
    data: {
      userId: letter.mahasiswaId,
      title: "Surat Anda telah diterbitkan",
      body: `Nomor: ${nomor}. Silakan unduh/cetak dari sistem.`,
      link: `/surat/${id}`,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "LETTER_SIGN",
      entity: "LetterRequest",
      entityId: id,
      metadata: { nomor, code: doc.code },
    },
  });
  return NextResponse.json({ ok: true, nomor, code: doc.code });
}
