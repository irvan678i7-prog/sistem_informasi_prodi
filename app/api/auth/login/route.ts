import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { identifier?: string; password?: string; scope?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Body invalid" }, { status: 400 });
  }
  const identifier = (body.identifier || "").trim();
  const password = (body.password || "").trim();
  const scope = body.scope === "admin" ? "admin" : "user";

  if (!identifier || !password) {
    return NextResponse.json(
      { message: "NIM/NIP/Email dan password wajib diisi" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { nimNip: identifier }],
    },
  });
  if (!user || !user.isActive) {
    return NextResponse.json(
      { message: "Akun tidak ditemukan atau dinonaktifkan" },
      { status: 401 },
    );
  }
  const ok = await verifyPassword(password, user.hashedPassword);
  if (!ok) {
    return NextResponse.json({ message: "Password salah" }, { status: 401 });
  }
  if (scope === "admin" && user.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Akun ini bukan administrator" },
      { status: 403 },
    );
  }
  const token = signSession({
    uid: user.id,
    role: user.role,
    name: user.name,
    nimNip: user.nimNip,
  });
  await setSessionCookie(token);
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      metadata: { scope },
    },
  });
  return NextResponse.json({ ok: true });
}
