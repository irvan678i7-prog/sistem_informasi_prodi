import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });

  const { id } = await ctx.params;
  const kut = await prisma.kUT.findUnique({
    where: { id },
    include: { tesis: true },
  });
  if (!kut) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  let by: "P1" | "P2" | "KAPRODI" = "P1";
  try {
    const body = await req.json();
    by = body?.by;
  } catch {
    // default
  }

  if (by === "P1") {
    if (kut.tesis.pembimbing1Id !== session.uid)
      return NextResponse.json({ message: "Bukan Pembimbing 1" }, { status: 403 });
  } else if (by === "P2") {
    if (kut.tesis.pembimbing2Id !== session.uid)
      return NextResponse.json({ message: "Bukan Pembimbing 2" }, { status: 403 });
  } else if (by === "KAPRODI") {
    if (session.role !== "KAPRODI")
      return NextResponse.json({ message: "Bukan Kaprodi" }, { status: 403 });
  }

  const now = new Date();
  const data: {
    p1Approved?: boolean;
    p1ApprovedAt?: Date;
    p2Approved?: boolean;
    p2ApprovedAt?: Date;
    kaprodiApproved?: boolean;
    kaprodiApprovedAt?: Date;
  } = {};
  if (by === "P1") {
    data.p1Approved = true;
    data.p1ApprovedAt = now;
  }
  if (by === "P2") {
    data.p2Approved = true;
    data.p2ApprovedAt = now;
  }
  if (by === "KAPRODI") {
    data.kaprodiApproved = true;
    data.kaprodiApprovedAt = now;
  }

  const all =
    (kut.p1Approved || by === "P1") &&
    (kut.p2Approved || by === "P2" || !kut.tesis.pembimbing2Id) &&
    (kut.kaprodiApproved || by === "KAPRODI");

  await prisma.kUT.update({
    where: { id },
    data: { ...data, status: all ? "APPROVED" : "VERIFIED" },
  });

  if (all) {
    await prisma.tesis.update({
      where: { id: kut.tesisId },
      data: {
        stage: "SIDANG",
        timeline: {
          create: {
            stage: "KUT_APPROVED",
            note: "KUT disetujui penuh",
            actorId: session.uid,
          },
        },
      },
    });
    await prisma.notification.create({
      data: {
        userId: kut.tesis.mahasiswaId,
        title: "KUT Disetujui",
        body: "Anda dapat mendaftar Sidang Tesis.",
        link: `/tesis/sidang`,
      },
    });
  }
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_KUT_APPROVE",
      entity: "KUT",
      entityId: id,
      metadata: { by },
    },
  });
  return NextResponse.json({ ok: true });
}
