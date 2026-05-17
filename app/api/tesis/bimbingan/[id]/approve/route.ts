import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });

  const { id } = await ctx.params;
  const log = await prisma.bimbinganLog.findUnique({
    where: { id },
    include: { tesis: true },
  });
  if (!log) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
  if (log.dosenId !== session.uid)
    return NextResponse.json({ message: "Bukan dosen ybs" }, { status: 403 });

  await prisma.bimbinganLog.update({
    where: { id },
    data: { approved: true },
  });
  await prisma.notification.create({
    data: {
      userId: log.tesis.mahasiswaId,
      title: "Bimbingan Diparaf",
      body: `Catatan bimbingan tanggal ${log.tanggal.toLocaleDateString("id-ID")} telah diparaf.`,
      link: `/tesis/bimbingan`,
    },
  });
  return NextResponse.json({ ok: true });
}
