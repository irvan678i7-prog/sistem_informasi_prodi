import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const Body = z.object({
  tesisId: z.string().min(1),
  tanggal: z.string().min(1),
  dosenId: z.string().min(1),
  topik: z.string().min(2),
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

  const tanggal = new Date(parsed.tanggal);
  if (Number.isNaN(tanggal.getTime()))
    return NextResponse.json({ message: "Tanggal tidak valid" }, { status: 400 });

  const log = await prisma.bimbinganLog.create({
    data: {
      tesisId: tesis.id,
      dosenId: parsed.dosenId,
      tanggal,
      topik: parsed.topik,
      catatan: parsed.catatan || null,
    },
  });
  await prisma.notification.create({
    data: {
      userId: parsed.dosenId,
      title: "Catatan Bimbingan Baru",
      body: `${session.name} mencatat: ${parsed.topik}`,
      link: `/bimbingan`,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_BIMBINGAN_LOG",
      entity: "BimbinganLog",
      entityId: log.id,
    },
  });
  return NextResponse.json({ id: log.id });
}
