import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadBufferToSupabase } from "@/lib/storage";
import { BIMBINGAN_SECTIONS, sectionLabel } from "@/lib/bimbinganArtikel";
import type { BimbinganSection } from "@prisma/client";

const VALID_SECTIONS = new Set(BIMBINGAN_SECTIONS.map((s) => s.section));

// Mahasiswa mengunggah PDF untuk satu bagian lembar bimbingan artikel.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "MAHASISWA")
    return NextResponse.json({ message: "Hanya mahasiswa" }, { status: 403 });

  const form = await req.formData();
  const tesisId = String(form.get("tesisId") || "");
  const section = String(form.get("section") || "") as BimbinganSection;
  const file = form.get("file");

  if (!tesisId || !VALID_SECTIONS.has(section) || !(file instanceof File))
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });

  const allowedWord = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedWord.includes(file.type) && !/\.(doc|docx)$/i.test(file.name))
    return NextResponse.json({ message: "File harus Word (.doc atau .docx)" }, { status: 400 });

  // Dokumen Word sering lebih besar dari PDF karena menyimpan gambar/font.
  // Beri batas 10 MB khusus unggahan bimbingan, tanpa mengubah validasi tipe.
  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json(
      { message: "Ukuran file Word melebihi batas maksimal 10MB" },
      { status: 413 },
    );

  const tesis = await prisma.tesis.findUnique({ where: { id: tesisId } });
  if (!tesis || tesis.mahasiswaId !== session.uid)
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const ab = await file.arrayBuffer();
  const buf = Buffer.from(ab);
  const path = `bimbingan-artikel/${session.uid}/${section}-${Date.now()}-${file.name}`;
  const { url } = await uploadBufferToSupabase(
    path,
    buf,
    file.type || "application/pdf",
  );

  // Satu baris per (tesis, section) — upsert agar unggah ulang mengganti
  // berkas. Jika sebelumnya sudah ada berkas, unggahan baru dihitung sebagai
  // revisi (revisiKe bertambah) sehingga tampil bertanda "Revisi ke-N".
  const existing = await prisma.bimbinganArtikel.findUnique({
    where: { tesisId_section: { tesisId, section } },
    select: { fileUrl: true, revisiKe: true },
  });
  const isRevisi = !!existing?.fileUrl;
  const revisiKe = isRevisi ? (existing?.revisiKe ?? 0) + 1 : 0;

  await prisma.bimbinganArtikel.upsert({
    where: { tesisId_section: { tesisId, section } },
    create: { tesisId, section, fileUrl: url, fileName: file.name },
    update: { fileUrl: url, fileName: file.name, revisiKe },
  });
  // Simpan setiap unggahan sebagai riwayat; berkas lama tidak dihapus.
  await prisma.bimbinganArtikelFile.create({
    data: { tesisId, section, revision: revisiKe, fileUrl: url, fileName: file.name },
  });

  // Beritahu kedua pembimbing bahwa ada berkas baru/revisi untuk ditinjau.
  const trackLabel = tesis.track === "ARTIKEL" ? "Artikel" : "Tesis";
  const recipients = [tesis.pembimbing1Id, tesis.pembimbing2Id].filter(
    (v): v is string => !!v,
  );
  if (recipients.length) {
    await prisma.notification.createMany({
      data: recipients.map((userId) => ({
        userId,
        title: isRevisi
          ? `Revisi Bimbingan ${trackLabel}`
          : `Berkas Bimbingan ${trackLabel} Baru`,
        body: isRevisi
          ? `${session.name} mengunggah revisi ke-${revisiKe} untuk bagian "${sectionLabel(section)}".`
          : `${session.name} mengunggah berkas bagian "${sectionLabel(section)}".`,
        link: `/bimbingan/artikel/${tesisId}`,
      })),
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "BIMBINGAN_ARTIKEL_UPLOAD",
      entity: "Tesis",
      entityId: tesisId,
      metadata: { section },
    },
  });

  return NextResponse.json({ ok: true });
}
