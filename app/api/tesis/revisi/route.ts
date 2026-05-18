import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadBuffer } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "MAHASISWA")
    return NextResponse.json({ message: "Hanya mahasiswa" }, { status: 403 });

  const form = await req.formData();
  const tesisId = String(form.get("tesisId") || "");
  const note = (form.get("note") || "").toString();
  const file = form.get("file");
  if (!tesisId || !(file instanceof File))
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });

  const tesis = await prisma.tesis.findUnique({ where: { id: tesisId } });
  if (!tesis || tesis.mahasiswaId !== session.uid)
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const ab = await file.arrayBuffer();
  const buf = Buffer.from(ab);
  const path = `revisi/${session.uid}/${Date.now()}-${file.name}`;
  const { url } = await uploadBuffer(
    path,
    buf,
    file.type || "application/pdf",
  );

  const r = await prisma.tesisRevisi.create({
    data: {
      tesisId,
      catatan: note || null,
      fileUrl: url,
    },
  });
  await prisma.tesis.update({
    where: { id: tesisId },
    data: {
      stage: "REVISI",
      timeline: {
        create: {
          stage: "REVISI_UPLOAD",
          note: note || "Mahasiswa mengunggah revisi",
          actorId: session.uid,
        },
      },
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_REVISI_UPLOAD",
      entity: "TesisRevisi",
      entityId: r.id,
    },
  });
  return NextResponse.json({ id: r.id });
}
