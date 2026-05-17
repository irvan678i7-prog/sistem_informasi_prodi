import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isDosen } from "@/lib/rbac";
import type { SidangResult } from "@prisma/client";

const MAP: Record<string, SidangResult> = {
  lulus: "LULUS",
  "lulus-revisi": "LULUS_DENGAN_REVISI",
  tidak: "TIDAK_LULUS",
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (!isDosen(session.role))
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const { id } = await ctx.params;
  let result: SidangResult | undefined;
  try {
    const body = await req.json();
    result = MAP[body?.result];
  } catch {
    // empty
  }
  if (!result)
    return NextResponse.json({ message: "Hasil tidak valid" }, { status: 400 });

  const seminar = await prisma.seminarProposal.findUnique({
    where: { id },
    include: { tesis: true },
  });
  if (!seminar) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  await prisma.seminarProposal.update({
    where: { id },
    data: { hasil: result },
  });
  // After seminar passed: move to BIMBINGAN
  if (result === "LULUS" || result === "LULUS_DENGAN_REVISI") {
    await prisma.tesis.update({
      where: { id: seminar.tesisId },
      data: {
        stage: "BIMBINGAN",
        timeline: {
          create: {
            stage: "SEMINAR_PASSED",
            note: `Hasil seminar: ${result}`,
            actorId: session.uid,
          },
        },
      },
    });
  }
  await prisma.notification.create({
    data: {
      userId: seminar.tesis.mahasiswaId,
      title: "Hasil Seminar Proposal",
      body: `Hasil seminar Anda: ${result.replace(/_/g, " ")}.`,
      link: `/tesis/seminar`,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_SEMINAR_RESULT",
      entity: "SeminarProposal",
      entityId: id,
      metadata: { result },
    },
  });
  return NextResponse.json({ ok: true });
}
