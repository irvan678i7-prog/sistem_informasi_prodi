import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  uploadBufferToSupabase,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
} from "@/lib/storage";

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

  if (file.size > MAX_UPLOAD_BYTES)
    return NextResponse.json(
      { message: `Ukuran file melebihi batas maksimal ${MAX_UPLOAD_LABEL}` },
      { status: 413 },
    );

  const tesis = await prisma.tesis.findUnique({ where: { id: tesisId } });
  if (!tesis || tesis.mahasiswaId !== session.uid)
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const ab = await file.arrayBuffer();
  const buf = Buffer.from(ab);
  const path = `revisi/${session.uid}/${Date.now()}-${file.name}`;
  const { url } = await uploadBufferToSupabase(
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
  // Kirim notifikasi ke kedua pembimbing (dan Kaprodi prodi mahasiswa) agar
  // revisi yang diunggah benar-benar sampai ke dosen.
  const mahasiswa = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { prodiId: true },
  });
  const kaprodi = mahasiswa?.prodiId
    ? await prisma.user.findFirst({
        where: { role: "KAPRODI", prodiId: mahasiswa.prodiId, isActive: true },
        select: { id: true },
      })
    : null;
  const recipients = [
    ...new Set(
      [tesis.pembimbing1Id, tesis.pembimbing2Id, kaprodi?.id].filter(
        (v): v is string => !!v,
      ),
    ),
  ];
  if (recipients.length) {
    await prisma.notification.createMany({
      data: recipients.map((userId) => ({
        userId,
        title: "Revisi Tesis Baru",
        body: `${session.name} (${session.nimNip}) mengunggah berkas revisi tesis.`,
        link: `/tesis/${tesisId}`,
      })),
    });
  }

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
