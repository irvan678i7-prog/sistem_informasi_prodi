import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const Body = z.object({
  comment: z.string().min(3, "Catatan revisi wajib diisi"),
});

/**
 * Minta revisi judul. Bisa dilakukan oleh PA terkait (saat status SUBMITTED)
 * atau Kaprodi (saat status VERIFIED, sudah disetujui PA). Mengembalikan
 * judulStatus ke DRAFT sehingga mahasiswa dapat menyunting & mengajukan ulang.
 * Catatan revisi disimpan di timeline dengan actorId pengomentar.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });

  const { id } = await ctx.params;
  const tesis = await prisma.tesis.findUnique({
    where: { id },
    include: { mahasiswa: { select: { prodiId: true } } },
  });
  if (!tesis)
    return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  // Otorisasi sesuai tahap: PA pada SUBMITTED, Kaprodi pada VERIFIED.
  const isPA = tesis.paId === session.uid;
  const isKaprodi = session.role === "KAPRODI";
  const isAdmin = session.role === "ADMIN";

  if (tesis.judulStatus === "SUBMITTED") {
    if (!isPA && !isAdmin)
      return NextResponse.json(
        { message: "Hanya PA terkait yang dapat meminta revisi pada tahap ini" },
        { status: 403 },
      );
  } else if (tesis.judulStatus === "VERIFIED") {
    if (!isKaprodi && !isAdmin)
      return NextResponse.json(
        { message: "Hanya Kaprodi yang dapat meminta revisi pada tahap ini" },
        { status: 403 },
      );
    // Kaprodi hanya untuk prodinya.
    if (isKaprodi) {
      const me = await prisma.user.findUnique({
        where: { id: session.uid },
        select: { prodiId: true },
      });
      if (
        tesis.mahasiswa.prodiId &&
        tesis.mahasiswa.prodiId !== (me?.prodiId ?? null)
      )
        return NextResponse.json(
          { message: "Mahasiswa ini bukan dari prodi Anda" },
          { status: 403 },
        );
    }
  } else {
    return NextResponse.json(
      { message: "Status judul saat ini tidak dapat diminta revisi" },
      { status: 400 },
    );
  }

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Catatan revisi tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  await prisma.tesis.update({
    where: { id },
    data: {
      // Kembali ke DRAFT agar mahasiswa dapat menyunting & mengajukan ulang.
      judulStatus: "DRAFT",
      timeline: {
        create: {
          stage: "JUDUL_REVISION_REQUESTED",
          note: parsed.comment,
          actorId: session.uid,
        },
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: tesis.mahasiswaId,
      title: "Revisi Judul Diminta",
      body: `${session.name}: ${parsed.comment}`,
      link: "/tesis/judul",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_JUDUL_REVISION",
      entity: "Tesis",
      entityId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
