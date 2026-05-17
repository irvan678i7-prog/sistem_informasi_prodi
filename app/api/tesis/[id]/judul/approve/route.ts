import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });

  const { id } = await ctx.params;
  const tesis = await prisma.tesis.findUnique({ where: { id } });
  if (!tesis) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
  if (tesis.paId !== session.uid && session.role !== "ADMIN_SISTEM")
    return NextResponse.json({ message: "Hanya PA terkait" }, { status: 403 });
  if (tesis.judulStatus !== "SUBMITTED")
    return NextResponse.json({ message: "Status tidak sesuai" }, { status: 400 });

  let which: number = 1;
  try {
    const body = await req.json();
    which = body?.which === 2 ? 2 : 1;
  } catch {
    // default
  }

  const judulFinal = which === 2 ? tesis.judul2 : tesis.judul1;

  await prisma.tesis.update({
    where: { id },
    data: {
      judulFinal,
      judulStatus: "APPROVED",
      stage: "PROPOSAL",
      timeline: {
        create: {
          stage: "JUDUL_APPROVED",
          note: `Judul ke-${which} disetujui PA`,
          actorId: session.uid,
        },
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: tesis.mahasiswaId,
      title: "Judul Tesis Disetujui",
      body: `Judul Anda telah disetujui PA. Silakan lanjut ke penyusunan proposal.`,
      link: `/tesis`,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_JUDUL_APPROVE",
      entity: "Tesis",
      entityId: id,
      metadata: { which },
    },
  });

  return NextResponse.json({ ok: true });
}
