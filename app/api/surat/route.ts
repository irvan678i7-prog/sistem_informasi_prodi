import { NextResponse } from "next/server";
import { z } from "zod";
import type { LetterType } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  type: z.enum([
    "AKTIF_KULIAH",
    "IZIN_PENELITIAN",
    "CUTI_AKADEMIK",
    "PENGANTAR_SKPI",
    "BEBAS_PLAGIASI",
  ]),
  payload: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }
  if (session.role !== "MAHASISWA") {
    return NextResponse.json(
      { message: "Hanya mahasiswa yang dapat mengajukan surat" },
      { status: 403 },
    );
  }

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const letter = await prisma.letterRequest.create({
    data: {
      type: parsed.type as LetterType,
      status: "SUBMITTED",
      mahasiswaId: session.uid,
      payload: parsed.payload as Prisma.InputJsonValue,
      timeline: {
        create: {
          stage: "SUBMITTED",
          note: "Diajukan oleh mahasiswa",
          actorId: session.uid,
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "LETTER_CREATE",
      entity: "LetterRequest",
      entityId: letter.id,
      metadata: { type: parsed.type },
    },
  });

  // Notify admin prodi / kaprodi of mahasiswa's prodi
  const me = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { prodiId: true, name: true, nimNip: true },
  });
  if (me?.prodiId) {
    const handlers = await prisma.user.findMany({
      where: { prodiId: me.prodiId, role: { in: ["ADMIN_PRODI", "KAPRODI"] } },
      select: { id: true },
    });
    if (handlers.length) {
      await prisma.notification.createMany({
        data: handlers.map((h) => ({
          userId: h.id,
          title: "Pengajuan surat baru",
          body: `${me.name} (${me.nimNip}) mengajukan ${parsed.type.replace(/_/g, " ")}`,
          link: `/surat/${letter.id}`,
        })),
      });
    }
  }

  return NextResponse.json({ id: letter.id });
}
