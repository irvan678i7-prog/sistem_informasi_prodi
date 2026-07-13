import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

const Patch = z.object({
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  nimNip: z.string().min(3).optional(),
  role: z.enum(["ADMIN", "KAPRODI", "DOSEN", "MAHASISWA"]).optional(),
  prodiId: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  angkatan: z.number().int().nullable().optional(),
  nidn: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "ADMIN")
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

  // Admin tidak boleh mengubah peran akunnya sendiri agar tidak
  // kehilangan akses admin secara tidak sengaja.
  if (parsed.role && id === session.uid && parsed.role !== "ADMIN")
    return NextResponse.json(
      { message: "Tidak dapat mengubah peran akun sendiri" },
      { status: 400 },
    );

  const data: {
    isActive?: boolean;
    hashedPassword?: string;
    name?: string;
    email?: string;
    nimNip?: string;
    role?: "ADMIN" | "KAPRODI" | "DOSEN" | "MAHASISWA";
    prodiId?: string | null;
    phone?: string | null;
    address?: string | null;
  } = {};
  if (parsed.isActive !== undefined) data.isActive = parsed.isActive;
  if (parsed.password) data.hashedPassword = await hashPassword(parsed.password);
  if (parsed.name) data.name = parsed.name;
  if (parsed.email) data.email = parsed.email.toLowerCase();
  if (parsed.nimNip) data.nimNip = parsed.nimNip;
  if (parsed.role) data.role = parsed.role;
  if (parsed.prodiId !== undefined) data.prodiId = parsed.prodiId;
  if (parsed.phone !== undefined) data.phone = parsed.phone;
  if (parsed.address !== undefined) data.address = parsed.address;

  try {
    await prisma.user.update({ where: { id }, data });

    // angkatan (mahasiswa) dan nidn (dosen) disimpan pada tabel profile,
    // bukan langsung pada User.
    if (parsed.angkatan !== undefined && parsed.angkatan !== null) {
      await prisma.mahasiswaProfile.upsert({
        where: { userId: id },
        update: { angkatan: parsed.angkatan },
        create: { userId: id, angkatan: parsed.angkatan },
      });
    }
    if (parsed.nidn !== undefined) {
      await prisma.dosenProfile.upsert({
        where: { userId: id },
        update: { nidn: parsed.nidn },
        create: { userId: id, nidn: parsed.nidn },
      });
    }
  } catch {
    return NextResponse.json(
      { message: "Gagal menyimpan. NIM/NIDN atau email mungkin sudah dipakai." },
      { status: 400 },
    );
  }

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
  if (session.role !== "ADMIN")
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
