import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (session) {
    await prisma.auditLog.create({
      data: {
        actorId: session.uid,
        action: "LOGOUT",
        entity: "User",
        entityId: session.uid,
      },
    });
  }
  await clearSessionCookie();
  return NextResponse.redirect(
    new URL(
      "/login",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ),
    { status: 303 },
  );
}
