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
  if (tesis.judulStatus !== "SUBMITTED")
    return NextResponse.json({ message: "Status tidak sesuai" }, { status: 400 });

  let which: number = 1;
  let comment = "";
  try {
    const body = await req.json();
    which = body?.which === 2 ? 2 : body?.which === 3 ? 3 : 1;
    comment = (body?.comment ?? "").toString().trim();
  } catch {
    // default
  }

  const judulFinal =
    which === 3 ? tesis.judul3 : which === 2 ? tesis.judul2 : tesis.judul1;
  const note = comment
    ? `Judul ke-${which} disetujui PA, menunggu finalisasi Kaprodi. Catatan: ${comment}`
    : `Judul ke-${which} disetujui PA, menunggu finalisasi Kaprodi`;

  await prisma.tesis.update({
    where: { id },
    data: {
      judulFinal,
      // PA hanya merekomendasikan; status menunggu finalisasi Kaprodi.
      judulStatus: "VERIFIED",
      timeline: {
        create: {
          stage: "JUDUL_PA_APPROVED",
          note,
          actorId: session.uid,
        },
      },
    },
  });

  // Notifikasi: ke mahasiswa & ke Kaprodi prodi terkait.
  const mhs = await prisma.user.findUnique({
    where: { id: tesis.mahasiswaId },
    select: { name: true, nimNip: true, prodiId: true },
  });
  const notifs: Array<{
    userId: string;
    title: string;
    body: string;
    link: string;
  }> = [
    {
      userId: tesis.mahasiswaId,
      title: "Judul Disetujui PA",
      body: `Judul Anda telah disetujui PA dan diteruskan ke Kaprodi untuk finalisasi.`,
      link: `/tesis/judul`,
    },
  ];
  if (mhs?.prodiId) {
    const kaprodiList = await prisma.user.findMany({
      where: { role: "KAPRODI", prodiId: mhs.prodiId, isActive: true },
      select: { id: true },
    });
    for (const k of kaprodiList) {
      notifs.push({
        userId: k.id,
        title: "Judul Menunggu Finalisasi",
        body: `${mhs.name} (${mhs.nimNip}) telah disetujui PA. Silakan finalisasi.`,
        link: `/tesis/judul`,
      });
    }
  }
  await prisma.notification.createMany({ data: notifs });

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
