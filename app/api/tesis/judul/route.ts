import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const Body = z.object({
  judul1: z.string().min(5),
  judul2: z.string().min(5),
  judul3: z.string().min(5),
  jenis1: z.string().min(1),
  jenis2: z.string().min(1),
  jenis3: z.string().min(1),
  paId: z.string().min(1),
  track: z.enum(["TESIS", "ARTIKEL"]).default("TESIS"),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "MAHASISWA")
    return NextResponse.json({ message: "Hanya mahasiswa" }, { status: 403 });

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  // Lock editing once the judul has been approved (by PA or finalised by
  // Kaprodi). Approved-tanpa-revisi tidak dapat diubah lagi; jika perlu diubah,
  // reviewer harus meminta revisi terlebih dahulu (status kembali ke DRAFT).
  const existing = await prisma.tesis.findUnique({
    where: { mahasiswaId: session.uid },
    select: { judulStatus: true },
  });
  if (
    existing &&
    (existing.judulStatus === "VERIFIED" || existing.judulStatus === "APPROVED")
  ) {
    return NextResponse.json(
      {
        message:
          "Judul sudah disetujui dan tidak dapat diubah. Hubungi PA/Kaprodi untuk meminta revisi.",
      },
      { status: 409 },
    );
  }

  const tesis = await prisma.tesis.upsert({
    where: { mahasiswaId: session.uid },
    create: {
      mahasiswaId: session.uid,
      judul1: parsed.judul1,
      judul2: parsed.judul2,
      judul3: parsed.judul3,
      jenis1: parsed.jenis1,
      jenis2: parsed.jenis2,
      jenis3: parsed.jenis3,
      paId: parsed.paId,
      track: parsed.track,
      stage: "JUDUL",
      judulStatus: "SUBMITTED",
      timeline: {
        create: {
          stage: "JUDUL_SUBMITTED",
          note: "Mahasiswa mengajukan 3 judul",
          actorId: session.uid,
        },
      },
    },
    update: {
      judul1: parsed.judul1,
      judul2: parsed.judul2,
      judul3: parsed.judul3,
      jenis1: parsed.jenis1,
      jenis2: parsed.jenis2,
      jenis3: parsed.jenis3,
      paId: parsed.paId,
      track: parsed.track,
      judulStatus: "SUBMITTED",
      timeline: {
        create: {
          stage: "JUDUL_RESUBMITTED",
          note: "Mahasiswa mengajukan ulang judul",
          actorId: session.uid,
        },
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: parsed.paId,
      title: "Pengajuan Judul Tesis Baru",
      body: `${session.name} (${session.nimNip}) mengajukan 3 judul untuk Anda review.`,
      link: `/tesis/judul`,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_JUDUL_SUBMIT",
      entity: "Tesis",
      entityId: tesis.id,
    },
  });

  return NextResponse.json({ id: tesis.id });
}
