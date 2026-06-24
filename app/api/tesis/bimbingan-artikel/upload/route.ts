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

  // Satu baris per (tesis, section) — upsert agar unggah ulang mengganti berkas.
  await prisma.bimbinganArtikel.upsert({
    where: { tesisId_section: { tesisId, section } },
    create: { tesisId, section, fileUrl: url, fileName: file.name },
    update: { fileUrl: url, fileName: file.name },
  });

  // Beritahu kedua pembimbing bahwa ada berkas baru untuk ditinjau.
  const recipients = [tesis.pembimbing1Id, tesis.pembimbing2Id].filter(
    (v): v is string => !!v,
  );
  if (recipients.length) {
    await prisma.notification.createMany({
      data: recipients.map((userId) => ({
        userId,
        title: "Berkas Bimbingan Artikel Baru",
        body: `${session.name} mengunggah berkas bagian "${sectionLabel(section)}".`,
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
