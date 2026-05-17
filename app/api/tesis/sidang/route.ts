import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { SidangMode } from "@prisma/client";

const Body = z.object({
  tesisId: z.string().min(1),
  jadwal: z.string().min(1),
  ruang: z.string().optional().nullable(),
  mode: z.enum(["OFFLINE", "ONLINE"]).default("OFFLINE"),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "MAHASISWA")
    return NextResponse.json({ message: "Hanya mahasiswa" }, { status: 403 });

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const tesis = await prisma.tesis.findUnique({
    where: { id: parsed.tesisId },
    include: { kut: true },
  });
  if (!tesis || tesis.mahasiswaId !== session.uid)
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  if (!tesis.kut || tesis.kut.status !== "APPROVED")
    return NextResponse.json({ message: "KUT belum disetujui" }, { status: 400 });

  const jadwal = new Date(parsed.jadwal);
  if (Number.isNaN(jadwal.getTime()))
    return NextResponse.json({ message: "Tanggal tidak valid" }, { status: 400 });

  const sidang = await prisma.sidangTesis.upsert({
    where: { tesisId: tesis.id },
    create: {
      tesisId: tesis.id,
      jadwal,
      ruang: parsed.ruang || null,
      mode: parsed.mode as SidangMode,
    },
    update: {
      jadwal,
      ruang: parsed.ruang || null,
      mode: parsed.mode as SidangMode,
    },
  });
  await prisma.tesis.update({
    where: { id: tesis.id },
    data: {
      timeline: {
        create: {
          stage: "SIDANG_REGISTERED",
          note: "Mahasiswa mendaftar sidang tesis",
          actorId: session.uid,
        },
      },
    },
  });

  const me = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { prodiId: true },
  });
  if (me?.prodiId) {
    const handlers = await prisma.user.findMany({
      where: { prodiId: me.prodiId, role: { in: ["KAPRODI", "DOSEN"] } },
      select: { id: true },
    });
    if (handlers.length)
      await prisma.notification.createMany({
        data: handlers.map((h) => ({
          userId: h.id,
          title: "Pendaftaran Sidang Tesis",
          body: `${session.name} mendaftar sidang.`,
          link: `/tesis/sidang`,
        })),
      });
  }
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_SIDANG_REGISTER",
      entity: "SidangTesis",
      entityId: sidang.id,
    },
  });
  return NextResponse.json({ id: sidang.id });
}
