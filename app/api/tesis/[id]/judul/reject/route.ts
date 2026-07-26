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
  if (tesis.paId !== session.uid && session.role !== "ADMIN")
    return NextResponse.json({ message: "Hanya PA terkait" }, { status: 403 });
  // Hanya judul yang berstatus SUBMITTED yang boleh ditolak — samakan dengan
  // handler approve. Tanpa ini, judul yang sudah APPROVED/REJECTED bisa ditolak
  // ulang, menimbulkan entri timeline & notifikasi ganda.
  if (tesis.judulStatus !== "SUBMITTED")
    return NextResponse.json({ message: "Status tidak sesuai" }, { status: 400 });

  let reason = "";
  try {
    const body = await req.json();
    reason = (body?.reason || "").toString().trim();
  } catch {
    // default
  }

  await prisma.tesis.update({
    where: { id },
    data: {
      judulStatus: "REJECTED",
      timeline: {
        create: {
          stage: "JUDUL_REJECTED",
          note: reason || "Ditolak tanpa alasan",
          actorId: session.uid,
        },
      },
    },
  });
  await prisma.notification.create({
    data: {
      userId: tesis.mahasiswaId,
      title: "Judul Tesis Ditolak",
      body: reason || "Silakan ajukan ulang.",
      link: `/tesis/judul`,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_JUDUL_REJECT",
      entity: "Tesis",
      entityId: id,
      metadata: { reason },
    },
  });
  return NextResponse.json({ ok: true });
}
