import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * Kaprodi finalize judul yang sudah disetujui PA (judulStatus === "VERIFIED").
 * Set ke "APPROVED" dan naikkan stage ke PROPOSAL.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "KAPRODI" && session.role !== "ADMIN")
    return NextResponse.json({ message: "Hanya Kaprodi" }, { status: 403 });

  const { id } = await ctx.params;
  const tesis = await prisma.tesis.findUnique({
    where: { id },
    include: { mahasiswa: { select: { prodiId: true, name: true } } },
  });
  if (!tesis)
    return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
  if (tesis.judulStatus !== "VERIFIED")
    return NextResponse.json(
      { message: "Judul belum disetujui PA atau sudah final" },
      { status: 400 },
    );

  // Kaprodi hanya boleh untuk prodinya.
  if (session.role === "KAPRODI") {
    const me = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { prodiId: true },
    });
    if (
      tesis.mahasiswa.prodiId &&
      tesis.mahasiswa.prodiId !== (me?.prodiId ?? null)
    ) {
      return NextResponse.json(
        { message: "Mahasiswa ini bukan dari prodi Anda" },
        { status: 403 },
      );
    }
  }

  let comment = "";
  try {
    const body = await req.json();
    comment = (body?.comment ?? "").toString().trim();
  } catch {
    // default — finalize tanpa catatan
  }

  await prisma.tesis.update({
    where: { id },
    data: {
      judulStatus: "APPROVED",
      stage: "PROPOSAL",
      timeline: {
        create: {
          stage: "JUDUL_FINALIZED",
          note: comment
            ? `Judul difinalisasi Kaprodi. Catatan: ${comment}`
            : "Judul difinalisasi Kaprodi",
          actorId: session.uid,
        },
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: tesis.mahasiswaId,
      title: "Judul Tesis Difinalisasi Kaprodi",
      body: `Judul "${tesis.judulFinal}" telah difinalisasi. Silakan lanjut ke penyusunan proposal.`,
      link: "/tesis",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_JUDUL_FINALIZE",
      entity: "Tesis",
      entityId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
