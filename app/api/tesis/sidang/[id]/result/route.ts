import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isDosen } from "@/lib/rbac";
import type { SidangResult } from "@prisma/client";

const VALID: SidangResult[] = ["LULUS", "LULUS_DENGAN_REVISI", "TIDAK_LULUS"];

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (!isDosen(session.role))
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const { id } = await ctx.params;
  let result: SidangResult = "LULUS";
  let nilaiText = "";
  try {
    const body = await req.json();
    if (VALID.includes(body?.result)) result = body.result;
    nilaiText = (body?.nilai || "").toString();
  } catch {
    // default
  }

  const sidang = await prisma.sidangTesis.findUnique({
    where: { id },
    include: { tesis: true },
  });
  if (!sidang) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  const parsedNilai = Number.parseFloat(nilaiText.replace(",", "."));
  await prisma.sidangTesis.update({
    where: { id },
    data: {
      hasil: result,
      nilaiAkhir: Number.isFinite(parsedNilai) ? parsedNilai : null,
    },
  });

  const nextStage =
    result === "LULUS"
      ? "SELESAI"
      : result === "LULUS_DENGAN_REVISI"
        ? "REVISI"
        : "SIDANG";

  await prisma.tesis.update({
    where: { id: sidang.tesisId },
    data: {
      stage: nextStage,
      timeline: {
        create: {
          stage: `SIDANG_${result}`,
          note: nilaiText ? `Nilai: ${nilaiText}` : null,
          actorId: session.uid,
        },
      },
    },
  });
  await prisma.notification.create({
    data: {
      userId: sidang.tesis.mahasiswaId,
      title: "Hasil Sidang Tesis",
      body: `Hasil: ${result.replace(/_/g, " ")}${nilaiText ? ` (Nilai ${nilaiText})` : ""}.`,
      link: `/tesis/sidang`,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_SIDANG_RESULT",
      entity: "SidangTesis",
      entityId: id,
      metadata: { result, nilai: nilaiText },
    },
  });
  return NextResponse.json({ ok: true });
}
