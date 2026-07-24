import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

const Body = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  nimNip: z.string().min(2),
  role: z.enum(["ADMIN", "KAPRODI", "DOSEN", "MAHASISWA", "TU"]),
  prodiId: z.string().nullable().optional(),
  password: z.string().min(6),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  angkatan: z.number().int().nullable().optional(),
  nidn: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const prodiId = parsed.prodiId || null;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: parsed.email }, { nimNip: parsed.nimNip }] },
  });
  if (existing)
    return NextResponse.json(
      { message: "Email atau NIM/NIP sudah dipakai" },
      { status: 400 },
    );

  const hashedPassword = await hashPassword(parsed.password);

  const created = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      nimNip: parsed.nimNip,
      role: parsed.role,
      prodiId,
      hashedPassword,
      phone: parsed.phone || null,
      address: parsed.address || null,
      mahasiswaProfile:
        parsed.role === "MAHASISWA"
          ? {
              create: {
                angkatan: parsed.angkatan ?? new Date().getFullYear(),
              },
            }
          : undefined,
      dosenProfile:
        parsed.role === "DOSEN" || parsed.role === "KAPRODI"
          ? {
              create: { nidn: parsed.nidn || null },
            }
          : undefined,
    },
  });

  if (parsed.role === "MAHASISWA") {
    await prisma.tesis.create({ data: { mahasiswaId: created.id } });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "USER_CREATE",
      entity: "User",
      entityId: created.id,
      metadata: { role: parsed.role },
    },
  });
  return NextResponse.json({ id: created.id });
}
