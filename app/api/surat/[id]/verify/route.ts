import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canHandleLetter } from "@/lib/rbac";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (!canHandleLetter(session.role))
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const { id } = await ctx.params;
  const letter = await prisma.letterRequest.findUnique({
    where: { id },
    include: { mahasiswa: true },
  });
  if (!letter) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
  if (letter.status !== "SUBMITTED")
    return NextResponse.json({ message: "Status tidak sesuai" }, { status: 400 });

  await prisma.letterRequest.update({
    where: { id },
    data: {
      status: "VERIFIED",
      handlerId: session.uid,
      timeline: {
        create: {
          stage: "VERIFIED",
          note: "Diverifikasi oleh admin/kaprodi",
          actorId: session.uid,
        },
      },
    },
  });
  await prisma.notification.create({
    data: {
      userId: letter.mahasiswaId,
      title: "Surat Anda telah diverifikasi",
      body: `Surat ${letter.type.replace(/_/g, " ")} telah diverifikasi dan menunggu persetujuan Kaprodi.`,
      link: `/surat/${id}`,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "LETTER_VERIFY",
      entity: "LetterRequest",
      entityId: id,
    },
  });
  return NextResponse.json({ ok: true });
}
