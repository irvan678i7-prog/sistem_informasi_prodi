import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const Body = z.object({
  // null = lepas PA
  paId: z.string().min(1).nullable(),
});

/**
 * Tetapkan / ubah Pembimbing Akademik (PA) untuk seorang mahasiswa.
 * Hanya Kaprodi (di prodinya) atau Admin.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "KAPRODI" && session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const { id } = await ctx.params;
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const tesis = await prisma.tesis.findUnique({
    where: { id },
    include: {
      mahasiswa: {
        include: { prodi: true, mahasiswaProfile: true },
      },
    },
  });
  if (!tesis)
    return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  // Kaprodi hanya boleh mengatur untuk mahasiswa di prodinya.
  if (session.role === "KAPRODI") {
    const kaprodi = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { prodiId: true },
    });
    if (
      tesis.mahasiswa.prodiId &&
      tesis.mahasiswa.prodiId !== (kaprodi?.prodiId ?? null)
    ) {
      return NextResponse.json(
        { message: "Mahasiswa ini bukan dari prodi Anda" },
        { status: 403 },
      );
    }
  }

  let paUser: { id: string; name: string; role: string } | null = null;
  if (parsed.paId) {
    const u = await prisma.user.findUnique({
      where: { id: parsed.paId },
      select: { id: true, name: true, role: true, isActive: true },
    });
    if (!u || !u.isActive)
      return NextResponse.json(
        { message: "Dosen PA tidak valid" },
        { status: 400 },
      );
    if (!["DOSEN", "KAPRODI"].includes(u.role))
      return NextResponse.json(
        { message: "PA harus DOSEN atau KAPRODI" },
        { status: 400 },
      );
    paUser = { id: u.id, name: u.name, role: u.role };
  }

  const previousPaId = tesis.paId;

  await prisma.tesis.update({
    where: { id },
    data: {
      paId: parsed.paId,
      timeline: {
        create: {
          stage: "PA_ASSIGN",
          note: paUser ? `PA: ${paUser.name}` : "PA dilepas",
          actorId: session.uid,
        },
      },
    },
  });

  // Update juga MahasiswaProfile.paId supaya konsisten.
  if (tesis.mahasiswa.mahasiswaProfile) {
    await prisma.mahasiswaProfile.update({
      where: { id: tesis.mahasiswa.mahasiswaProfile.id },
      data: { paId: parsed.paId },
    });
  }

  // Notifikasi ke mahasiswa & dosen PA baru / lama.
  const notifs: Array<{
    userId: string;
    title: string;
    body: string;
    link?: string;
  }> = [
    {
      userId: tesis.mahasiswaId,
      title: "Pembimbing Akademik diperbarui",
      body: paUser
        ? `Pembimbing Akademik (PA) Anda kini: ${paUser.name}.`
        : "Pembimbing Akademik (PA) Anda telah dilepas.",
      link: "/tesis",
    },
  ];
  if (paUser) {
    notifs.push({
      userId: paUser.id,
      title: "Penugasan PA Mahasiswa",
      body: `Anda ditetapkan sebagai Pembimbing Akademik (PA) untuk ${tesis.mahasiswa.name} (${tesis.mahasiswa.nimNip}).`,
      link: "/bimbingan",
    });
  }
  if (previousPaId && previousPaId !== parsed.paId) {
    notifs.push({
      userId: previousPaId,
      title: "Penugasan PA Dicabut",
      body: `Anda tidak lagi menjadi PA untuk ${tesis.mahasiswa.name} (${tesis.mahasiswa.nimNip}).`,
    });
  }
  await prisma.notification.createMany({ data: notifs });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_PA_ASSIGN",
      entity: "Tesis",
      entityId: id,
      metadata: { paId: parsed.paId, previousPaId },
    },
  });

  return NextResponse.json({ ok: true });
}
