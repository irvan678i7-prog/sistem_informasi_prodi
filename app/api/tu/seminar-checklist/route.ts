import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SEMINAR_BERKAS_ITEMS } from "@/lib/seminarBerkas";

const Body = z.object({
  tesisId: z.string().min(1),
  checklist: z.array(z.boolean()).length(SEMINAR_BERKAS_ITEMS.length),
});

// TU menyimpan ceklis ADA / TIDAK ADA berkas Seminar Proposal mahasiswa.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (
    session.role !== "TU" &&
    session.role !== "KAPRODI" &&
    session.role !== "ADMIN"
  )
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const tesis = await prisma.tesis.findUnique({
    where: { id: parsed.tesisId },
    select: { id: true },
  });
  if (!tesis)
    return NextResponse.json(
      { message: "Data tesis tidak ditemukan" },
      { status: 404 },
    );

  await prisma.tesis.update({
    where: { id: parsed.tesisId },
    data: { seminarChecklist: parsed.checklist },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "SEMINAR_CHECKLIST_UPDATE",
      entity: "Tesis",
      entityId: parsed.tesisId,
      metadata: { checklist: parsed.checklist },
    },
  });

  return NextResponse.json({ ok: true });
}
