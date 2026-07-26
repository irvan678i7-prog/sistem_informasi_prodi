import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canCheckSeminarBerkas } from "@/lib/rbac";
import { signDocument } from "@/lib/sign";
import {
  CHECKLIST_CONFIG,
  isChecklistJenis,
  parseChecklist,
  parseChecklistApproval,
} from "@/lib/checklist";

// TU "Sahkan & Terbitkan (ACC)" ceklis berkas (Seminar Proposal / Ujian Tesis).
// Membuat dokumen tersahkan (SignedDocument + QR verifikasi) lalu menyimpan
// metadata pengesahan di Tesis.checklistApproval agar mahasiswa dapat mengunduh.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (!canCheckSeminarBerkas(session.role))
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  let body: { tesisId?: string; jenis?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });
  }
  const tesisId = (body.tesisId || "").trim();
  if (!tesisId || !isChecklistJenis(body.jenis))
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });
  const jenis = body.jenis;
  const config = CHECKLIST_CONFIG[jenis];

  const tesis = await prisma.tesis.findUnique({
    where: { id: tesisId },
    select: {
      id: true,
      mahasiswaId: true,
      seminarChecklist: true,
      ujianChecklist: true,
      checklistApproval: true,
      mahasiswa: {
        select: {
          name: true,
          nimNip: true,
          prodi: { select: { name: true } },
        },
      },
    },
  });
  if (!tesis)
    return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  const raw =
    jenis === "seminar" ? tesis.seminarChecklist : tesis.ujianChecklist;
  if (!Array.isArray(raw) || raw.length === 0)
    return NextResponse.json(
      { message: "Ceklis belum diisi. Simpan ceklis ADA/TIDAK ADA terlebih dahulu." },
      { status: 400 },
    );

  const checks = parseChecklist(raw, jenis);
  const signer = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, name: true, role: true },
  });
  if (!signer)
    return NextResponse.json({ message: "Penandatangan tidak valid" }, {
      status: 400,
    });

  const doc = await signDocument({
    kind: "LAINNYA",
    payload: {
      docType: `CEKLIST_${jenis.toUpperCase()}`,
      jenis,
      tesisId: tesis.id,
      title: config.docTitle,
      mahasiswa: {
        name: tesis.mahasiswa.name,
        nimNip: tesis.mahasiswa.nimNip,
        prodi: tesis.mahasiswa.prodi?.name ?? null,
      },
      items: config.items.map((label, i) => ({
        no: i + 1,
        label,
        ada: checks[i],
      })),
    },
    signer,
  });

  const approval = parseChecklistApproval(tesis.checklistApproval);
  approval[jenis] = {
    code: doc.code,
    approvedAt: new Date().toISOString(),
    signerName: signer.name,
    signerRole: signer.role,
  };

  await prisma.tesis.update({
    where: { id: tesis.id },
    data: {
      checklistApproval: approval as unknown as Prisma.InputJsonValue,
    },
  });

  await prisma.notification.create({
    data: {
      userId: tesis.mahasiswaId,
      title: `Ceklis ${config.shortTitle} Disahkan`,
      body: `TU telah mengesahkan ceklis ${config.shortTitle}. Anda dapat mengunduh/mencetak dokumen resmi ber-TTD.`,
      link: `/cetak/ceklis/${jenis}/${tesis.id}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "CHECKLIST_APPROVE",
      entity: "Tesis",
      entityId: tesis.id,
      metadata: { jenis, code: doc.code },
    },
  });

  return NextResponse.json({ ok: true, code: doc.code });
}
