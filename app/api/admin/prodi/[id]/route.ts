import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const Patch = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  jenjang: z.string().min(1).optional(),
  kaprodiId: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  const { id } = await ctx.params;
  let parsed;
  try {
    parsed = Patch.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const data: {
    code?: string;
    name?: string;
    jenjang?: string;
    kaprodiId?: string | null;
  } = {};
  if (parsed.code) data.code = parsed.code;
  if (parsed.name) data.name = parsed.name;
  if (parsed.jenjang) data.jenjang = parsed.jenjang;
  if (parsed.kaprodiId !== undefined) data.kaprodiId = parsed.kaprodiId;

  await prisma.prodi.update({ where: { id }, data });
  if (parsed.kaprodiId) {
    await prisma.user.update({
      where: { id: parsed.kaprodiId },
      data: { role: "KAPRODI", prodiId: id },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "PRODI_UPDATE",
      entity: "Prodi",
      entityId: id,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  const { id } = await ctx.params;
  try {
    await prisma.prodi.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      {
        message: "Prodi memiliki user terkait. Pindahkan user dulu.",
      },
      { status: 400 },
    );
  }
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "PRODI_DELETE",
      entity: "Prodi",
      entityId: id,
    },
  });
  return NextResponse.json({ ok: true });
}
