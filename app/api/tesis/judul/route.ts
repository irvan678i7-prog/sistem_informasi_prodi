import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const Body = z.object({
  judul1: z.string().min(5),
  judul2: z.string().min(5),
  paId: z.string().min(1),
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

  const tesis = await prisma.tesis.upsert({
    where: { mahasiswaId: session.uid },
    create: {
      mahasiswaId: session.uid,
      judul1: parsed.judul1,
      judul2: parsed.judul2,
      paId: parsed.paId,
      stage: "JUDUL",
      judulStatus: "SUBMITTED",
      timeline: {
        create: {
          stage: "JUDUL_SUBMITTED",
          note: "Mahasiswa mengajukan 2 judul",
          actorId: session.uid,
        },
      },
    },
    update: {
      judul1: parsed.judul1,
      judul2: parsed.judul2,
      paId: parsed.paId,
      judulStatus: "SUBMITTED",
      timeline: {
        create: {
          stage: "JUDUL_RESUBMITTED",
          note: "Mahasiswa mengajukan ulang judul",
          actorId: session.uid,
        },
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: parsed.paId,
      title: "Pengajuan Judul Tesis Baru",
      body: `${session.name} (${session.nimNip}) mengajukan 2 judul untuk Anda review.`,
      link: `/tesis/judul`,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_JUDUL_SUBMIT",
      entity: "Tesis",
      entityId: tesis.id,
    },
  });

  return NextResponse.json({ id: tesis.id });
}
