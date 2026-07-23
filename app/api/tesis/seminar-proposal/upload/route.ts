import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadBufferToSupabase } from "@/lib/storage";
import { SEMINAR_BERKAS_ITEMS } from "@/lib/seminarBerkas";

// Mahasiswa mengunggah berkas syarat Seminar Proposal per item check list.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "MAHASISWA")
    return NextResponse.json({ message: "Hanya mahasiswa" }, { status: 403 });

  const form = await req.formData();
  const tesisId = String(form.get("tesisId") || "");
  const item = Number(form.get("item"));
  const file = form.get("file");

  if (
    !tesisId ||
    !Number.isInteger(item) ||
    item < 1 ||
    item > SEMINAR_BERKAS_ITEMS.length ||
    !(file instanceof File)
  )
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });

  // Berkas syarat dapat berupa PDF, Word, atau hasil pindai (JPG/PNG).
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];
  if (
    !allowed.includes(file.type) &&
    !/\.(pdf|doc|docx|jpe?g|png)$/i.test(file.name)
  )
    return NextResponse.json(
      { message: "File harus PDF, Word, atau gambar (JPG/PNG)" },
      { status: 400 },
    );

  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json(
      { message: "Ukuran file melebihi batas maksimal 10MB" },
      { status: 413 },
    );

  const tesis = await prisma.tesis.findUnique({ where: { id: tesisId } });
  if (!tesis || tesis.mahasiswaId !== session.uid)
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const ab = await file.arrayBuffer();
  const buf = Buffer.from(ab);
  const path = `seminar-proposal/${session.uid}/item${item}-${Date.now()}-${file.name}`;
  const contentType = file.type || "application/octet-stream";
  let url: string;
  try {
    ({ url } = await uploadBufferToSupabase(path, buf, contentType));
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menyimpan berkas",
      },
      { status: 500 },
    );
  }

  // Satu baris per (tesis, item) — unggah ulang menggantikan berkas lama.
  await prisma.seminarBerkas.upsert({
    where: { tesisId_item: { tesisId, item } },
    create: { tesisId, item, fileUrl: url, fileName: file.name },
    update: { fileUrl: url, fileName: file.name },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "SEMINAR_BERKAS_UPLOAD",
      entity: "Tesis",
      entityId: tesisId,
      metadata: { item },
    },
  });

  return NextResponse.json({ ok: true });
}
