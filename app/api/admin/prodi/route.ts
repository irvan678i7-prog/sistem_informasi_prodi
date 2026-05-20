import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const Body = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  jenjang: z.string().min(1).default("S2"),
  kaprodiId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const exists = await prisma.prodi.findUnique({ where: { code: parsed.code } });
  if (exists)
    return NextResponse.json(
      { message: "Kode prodi sudah dipakai" },
      { status: 400 },
    );

  const created = await prisma.prodi.create({
    data: {
      code: parsed.code,
      name: parsed.name,
      jenjang: parsed.jenjang,
      kaprodiId: parsed.kaprodiId || null,
    },
  });

  if (parsed.kaprodiId) {
    await prisma.user.update({
      where: { id: parsed.kaprodiId },
      data: { role: "KAPRODI", prodiId: created.id },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "PRODI_CREATE",
      entity: "Prodi",
      entityId: created.id,
    },
  });
  return NextResponse.json({ id: created.id });
}
