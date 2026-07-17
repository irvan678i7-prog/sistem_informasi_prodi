import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sectionLabel } from "@/lib/bimbinganArtikel";

const Body = z.object({
  tesisId: z.string().min(1),
  section: z.enum([
    "JUDUL",
    "PENDAHULUAN",
    "KAJIAN_PUSTAKA",
    "METODOLOGI",
    "INSTRUMEN",
    "HASIL",
    "KESIMPULAN",
    "REFERENSI",
  ]),
  severity: z.enum([
    "BAIK",
    "REVISI_RINGAN",
    "REVISI_SEDANG",
    "REVISI_BERAT",
  ]),
  note: z.string().max(2000).optional().nullable(),
});

// Pembimbing 1 / 2 mencatat skala revisi + catatan untuk satu bagian. Kolom
// yang ditulis (p1* atau p2*) ditentukan dari posisi pembimbing pada tesis.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role === "MAHASISWA")
    return NextResponse.json({ message: "Hanya pembimbing" }, { status: 403 });

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const tesis = await prisma.tesis.findUnique({
    where: { id: parsed.tesisId },
  });
  if (!tesis)
    return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  // Tentukan kolom pembimbing. Admin tidak punya kolom, jadi ditolak.
  const isP1 = tesis.pembimbing1Id === session.uid;
  const isP2 = tesis.pembimbing2Id === session.uid;
  if (!isP1 && !isP2)
    return NextResponse.json(
      { message: "Anda bukan pembimbing tesis ini" },
      { status: 403 },
    );

  const note = parsed.note?.trim() || null;
  const data = isP1
    ? { p1Note: note, p1Severity: parsed.severity, p1ReviewedAt: new Date() }
    : { p2Note: note, p2Severity: parsed.severity, p2ReviewedAt: new Date() };

  await prisma.bimbinganArtikel.upsert({
    where: {
      tesisId_section: { tesisId: parsed.tesisId, section: parsed.section },
    },
    create: { tesisId: parsed.tesisId, section: parsed.section, ...data },
    update: data,
  });

  // BAIK dianggap sebagai persetujuan untuk versi file aktif. Status approval
  // disimpan per versi sehingga riwayat revisi tetap dapat diaudit.
  const latest = await prisma.bimbinganArtikelFile.findFirst({
    where: { tesisId: parsed.tesisId, section: parsed.section },
    orderBy: { revision: "desc" },
  });
  if (latest) {
    const approvedPatch = isP1
      ? { p1Approved: parsed.severity === "BAIK" }
      : { p2Approved: parsed.severity === "BAIK" };
    const nextP1 = isP1 ? approvedPatch.p1Approved : latest.p1Approved;
    const nextP2 = isP2 ? approvedPatch.p2Approved : latest.p2Approved;
    await prisma.bimbinganArtikelFile.update({
      where: { id: latest.id },
      data: {
        ...approvedPatch,
        ...(nextP1 && nextP2 ? { approvedAt: new Date() } : {}),
      },
    });
  }

  await prisma.notification.create({
    data: {
      userId: tesis.mahasiswaId,
      title: "Evaluasi Bimbingan Artikel",
      body: `${session.name} menilai bagian "${sectionLabel(parsed.section)}".`,
      link: "/tesis/bimbingan-artikel",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "BIMBINGAN_ARTIKEL_REVIEW",
      entity: "Tesis",
      entityId: parsed.tesisId,
      metadata: { section: parsed.section, severity: parsed.severity },
    },
  });

  return NextResponse.json({ ok: true });
}
