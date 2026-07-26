import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canApproveLetter, canHandleLetter } from "@/lib/rbac";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (!canHandleLetter(session.role))
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const { id } = await ctx.params;
  let reason = "";
  try {
    const body = await req.json();
    reason = (body?.reason || "").toString().trim();
  } catch {
    // empty
  }

  const letter = await prisma.letterRequest.findUnique({
    where: { id },
    include: { mahasiswa: { select: { prodiId: true } } },
  });
  if (!letter) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
  if (letter.status !== "SUBMITTED" && letter.status !== "VERIFIED")
    return NextResponse.json({ message: "Status tidak sesuai" }, { status: 400 });

  // Batasi lintas-prodi (sama seperti verify).
  if (session.role !== "ADMIN") {
    const me = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { prodiId: true },
    });
    if (!me?.prodiId || me.prodiId !== letter.mahasiswa.prodiId)
      return NextResponse.json(
        { message: "Surat ini bukan dari prodi Anda" },
        { status: 403 },
      );
  }

  // Surat yang SUDAH diverifikasi hanya boleh ditolak oleh Kaprodi — mencegah
  // dosen biasa membatalkan keputusan verifikasi Kaprodi.
  if (letter.status === "VERIFIED" && !canApproveLetter(session.role))
    return NextResponse.json(
      { message: "Hanya Kaprodi yang dapat menolak surat terverifikasi" },
      { status: 403 },
    );

  await prisma.letterRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectReason: reason || null,
      timeline: {
        create: {
          stage: "REJECTED",
          note: reason || "Ditolak tanpa alasan tertulis",
          actorId: session.uid,
        },
      },
    },
  });
  await prisma.notification.create({
    data: {
      userId: letter.mahasiswaId,
      title: "Surat Anda ditolak",
      body: reason || "Pengajuan surat Anda ditolak.",
      link: `/surat/${id}`,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "LETTER_REJECT",
      entity: "LetterRequest",
      entityId: id,
      metadata: { reason },
    },
  });
  return NextResponse.json({ ok: true });
}
