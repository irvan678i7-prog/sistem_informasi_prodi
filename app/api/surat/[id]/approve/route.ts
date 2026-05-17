import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canApproveLetter } from "@/lib/rbac";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (!canApproveLetter(session.role))
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const { id } = await ctx.params;
  const letter = await prisma.letterRequest.findUnique({ where: { id } });
  if (!letter) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
  if (letter.status !== "VERIFIED")
    return NextResponse.json({ message: "Status tidak sesuai" }, { status: 400 });

  await prisma.letterRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      timeline: {
        create: {
          stage: "APPROVED",
          note: "Disetujui",
          actorId: session.uid,
        },
      },
    },
  });
  await prisma.notification.create({
    data: {
      userId: letter.mahasiswaId,
      title: "Surat Anda disetujui",
      body: `Surat ${letter.type.replace(/_/g, " ")} disetujui. Menunggu penerbitan.`,
      link: `/surat/${id}`,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "LETTER_APPROVE",
      entity: "LetterRequest",
      entityId: id,
    },
  });
  return NextResponse.json({ ok: true });
}
