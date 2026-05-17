import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const Body = z.object({
  tesisId: z.string().min(1),
  jadwal: z.string().min(1),
  ruang: z.string().optional().nullable(),
  pembimbingId: z.string().min(1),
  catatan: z.string().optional().nullable(),
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

  const tesis = await prisma.tesis.findUnique({ where: { id: parsed.tesisId } });
  if (!tesis || tesis.mahasiswaId !== session.uid)
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const jadwal = new Date(parsed.jadwal);
  if (Number.isNaN(jadwal.getTime()))
    return NextResponse.json({ message: "Tanggal tidak valid" }, { status: 400 });

  const seminar = await prisma.seminarProposal.create({
    data: {
      tesisId: tesis.id,
      jadwal,
      ruang: parsed.ruang || null,
      catatan: parsed.catatan || null,
    },
  });
  await prisma.tesis.update({
    where: { id: tesis.id },
    data: {
      stage: "SEMINAR_PROPOSAL",
      pembimbingProposalId: parsed.pembimbingId,
      timeline: {
        create: {
          stage: "SEMINAR_REGISTERED",
          note: "Mahasiswa mendaftar seminar proposal",
          actorId: session.uid,
        },
      },
    },
  });
  await prisma.notification.create({
    data: {
      userId: parsed.pembimbingId,
      title: "Pendaftaran Seminar Proposal",
      body: `${session.name} mendaftar seminar proposal.`,
      link: `/tesis/seminar`,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_SEMINAR_REGISTER",
      entity: "SeminarProposal",
      entityId: seminar.id,
    },
  });
  return NextResponse.json({ id: seminar.id });
}
