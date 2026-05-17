import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const Body = z.object({
  tesisId: z.string().min(1),
  plagiasiPersen: z.number().nullable().optional(),
  alatUji: z.string().optional().nullable(),
  tglUji: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
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

  const noteParts: string[] = [];
  if (parsed.plagiasiPersen !== null && parsed.plagiasiPersen !== undefined)
    noteParts.push(`Plagiasi ${parsed.plagiasiPersen}%`);
  if (parsed.alatUji) noteParts.push(`Alat: ${parsed.alatUji}`);
  if (parsed.tglUji) noteParts.push(`Tgl: ${parsed.tglUji}`);
  if (parsed.note) noteParts.push(parsed.note);

  const data = {
    notes: noteParts.length ? noteParts.join("; ") : null,
    status: "SUBMITTED" as const,
  };

  let kutId: string;
  if (tesis.kut) {
    const upd = await prisma.kUT.update({
      where: { id: tesis.kut.id },
      data,
    });
    kutId = upd.id;
  } else {
    const ins = await prisma.kUT.create({
      data: {
        tesisId: tesis.id,
        ...data,
      },
    });
    kutId = ins.id;
  }
  await prisma.tesis.update({
    where: { id: tesis.id },
    data: {
      stage: "KUT",
      timeline: {
        create: {
          stage: "KUT_SUBMITTED",
          note: "Mahasiswa mengajukan KUT",
          actorId: session.uid,
        },
      },
    },
  });

  // notify P1, P2, kaprodi
  const notifyIds: string[] = [];
  if (tesis.pembimbing1Id) notifyIds.push(tesis.pembimbing1Id);
  if (tesis.pembimbing2Id) notifyIds.push(tesis.pembimbing2Id);
  if (notifyIds.length)
    await prisma.notification.createMany({
      data: notifyIds.map((uid) => ({
        userId: uid,
        title: "Pengajuan KUT Baru",
        body: `${session.name} mengajukan Kelayakan Ujian Tesis.`,
        link: `/tesis/kut`,
      })),
    });

  const me = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { prodiId: true },
  });
  if (me?.prodiId) {
    const kaprodi = await prisma.user.findMany({
      where: { prodiId: me.prodiId, role: "KAPRODI" },
      select: { id: true },
    });
    if (kaprodi.length)
      await prisma.notification.createMany({
        data: kaprodi.map((k) => ({
          userId: k.id,
          title: "Pengajuan KUT Baru",
          body: `${session.name} mengajukan KUT.`,
          link: `/tesis/kut`,
        })),
      });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_KUT_SUBMIT",
      entity: "KUT",
      entityId: kutId,
    },
  });
  return NextResponse.json({ id: kutId });
}
