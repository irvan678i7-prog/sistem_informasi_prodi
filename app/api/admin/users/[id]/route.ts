import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

const Patch = z.object({
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  prodiId: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "ADMIN_SISTEM" && session.role !== "ADMIN_PRODI")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const { id } = await ctx.params;
  let parsed;
  try {
    parsed = Patch.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target)
    return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  if (session.role === "ADMIN_PRODI") {
    const me = await prisma.user.findUnique({ where: { id: session.uid } });
    if (!me?.prodiId || me.prodiId !== target.prodiId)
      return NextResponse.json(
        { message: "Tidak diizinkan (beda prodi)" },
        { status: 403 },
      );
    if (target.role === "ADMIN_SISTEM")
      return NextResponse.json(
        { message: "Tidak diizinkan" },
        { status: 403 },
      );
  }

  const data: {
    isActive?: boolean;
    hashedPassword?: string;
    name?: string;
    email?: string;
    prodiId?: string | null;
    phone?: string | null;
    address?: string | null;
  } = {};
  if (parsed.isActive !== undefined) data.isActive = parsed.isActive;
  if (parsed.password) data.hashedPassword = await hashPassword(parsed.password);
  if (parsed.name) data.name = parsed.name;
  if (parsed.email) data.email = parsed.email.toLowerCase();
  if (parsed.prodiId !== undefined) data.prodiId = parsed.prodiId;
  if (parsed.phone !== undefined) data.phone = parsed.phone;
  if (parsed.address !== undefined) data.address = parsed.address;

  await prisma.user.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "USER_UPDATE",
      entity: "User",
      entityId: id,
      metadata: { fields: Object.keys(data) },
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "ADMIN_SISTEM")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const { id } = await ctx.params;
  if (id === session.uid)
    return NextResponse.json(
      { message: "Tidak dapat menghapus akun sendiri" },
      { status: 400 },
    );

  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      {
        message:
          "User memiliki data terkait. Nonaktifkan saja akun ini sebagai gantinya.",
      },
      { status: 400 },
    );
  }
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "USER_DELETE",
      entity: "User",
      entityId: id,
    },
  });
  return NextResponse.json({ ok: true });
}
