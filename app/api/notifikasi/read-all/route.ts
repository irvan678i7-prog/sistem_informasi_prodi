import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  await prisma.notification.updateMany({
    where: { userId: session.uid, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
