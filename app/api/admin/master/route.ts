import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });
  }
  const entries = Object.entries(body || {}).filter(
    ([, v]) => typeof v === "string",
  ) as [string, string][];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "APPSETTING_UPDATE",
      metadata: { keys: entries.map(([k]) => k) },
    },
  });
  return NextResponse.json({ ok: true });
}
