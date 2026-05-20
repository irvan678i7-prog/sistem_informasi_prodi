import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { signDocument } from "@/lib/sign";
import { generateLetterNumber } from "@/lib/utils";

const Body = z.object({
  pembimbing1Id: z.string().min(1),
  pembimbing2Id: z.string().min(1).nullable().optional(),
  // Nomor SK opsional. Jika diisi Kaprodi, dipakai apa adanya.
  // Jika kosong, akan digenerate otomatis (urut tahun).
  nomor: z.string().trim().max(120).optional().nullable(),
});

/**
 * Assign / re-assign pembimbing for a tesis (Kaprodi only).
 *
 *  - Bisa dipakai TANPA syarat judul approved.
 *  - Bisa dipakai untuk MENGGANTI pembimbing yang sudah ada.
 *  - Setiap penetapan menerbitkan SK + notifikasi ke dosen pembimbing.
 *  - Nomor SK: Kaprodi boleh isi manual; kalau kosong, sistem auto-generate.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "KAPRODI" && session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const { id } = await ctx.params;
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  if (
    parsed.pembimbing2Id &&
    parsed.pembimbing2Id === parsed.pembimbing1Id
  ) {
    return NextResponse.json(
      { message: "Pembimbing 1 dan 2 tidak boleh sama" },
      { status: 400 },
    );
  }

  const tesis = await prisma.tesis.findUnique({
    where: { id },
    include: { mahasiswa: { include: { prodi: true } } },
  });
  if (!tesis)
    return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  if (
    session.role === "KAPRODI" &&
    tesis.mahasiswa.prodiId &&
    tesis.mahasiswa.prodiId !== (await getKaprodiProdiId(session.uid))
  ) {
    return NextResponse.json(
      { message: "Mahasiswa ini bukan dari prodi Anda" },
      { status: 403 },
    );
  }

  const [p1, p2, signer] = await Promise.all([
    prisma.user.findUnique({ where: { id: parsed.pembimbing1Id } }),
    parsed.pembimbing2Id
      ? prisma.user.findUnique({ where: { id: parsed.pembimbing2Id } })
      : Promise.resolve(null),
    prisma.user.findUnique({ where: { id: session.uid } }),
  ]);

  if (!p1 || !["DOSEN", "KAPRODI"].includes(p1.role))
    return NextResponse.json(
      { message: "Pembimbing 1 tidak valid" },
      { status: 400 },
    );
  if (parsed.pembimbing2Id && (!p2 || !["DOSEN", "KAPRODI"].includes(p2.role)))
    return NextResponse.json(
      { message: "Pembimbing 2 tidak valid" },
      { status: 400 },
    );
  if (!signer)
    return NextResponse.json(
      { message: "Penandatangan tidak valid" },
      { status: 400 },
    );

  // Nomor: pakai input Kaprodi kalau ada; kalau tidak, generate.
  let nomor: string;
  const manualNomor = parsed.nomor?.trim();
  if (manualNomor) {
    // Cek tabrakan dengan SK lain (uniqueness untuk SignedDocument.nomor not enforced;
    // cek manual via skBimbinganNo di Tesis).
    const collide = await prisma.tesis.findFirst({
      where: { skBimbinganNo: manualNomor, NOT: { id: tesis.id } },
      select: { id: true },
    });
    if (collide) {
      return NextResponse.json(
        { message: `Nomor SK "${manualNomor}" sudah dipakai SK lain` },
        { status: 400 },
      );
    }
    nomor = manualNomor;
  } else {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const count = await prisma.signedDocument.count({
      where: { kind: "SK_PEMBIMBING", signedAt: { gte: yearStart } },
    });
    nomor = generateLetterNumber(count + 1, "II.3.AU/SK.PPs");
  }

  const doc = await signDocument({
    kind: "SK_PEMBIMBING",
    nomor,
    payload: {
      tesisId: tesis.id,
      mahasiswa: {
        name: tesis.mahasiswa.name,
        nimNip: tesis.mahasiswa.nimNip,
        prodi: tesis.mahasiswa.prodi?.name,
      },
      judul: tesis.judulFinal || tesis.judul1 || "(judul belum final)",
      pembimbing1: p1.name,
      pembimbing2: p2?.name,
    },
    signer,
  });

  const previousPembimbingIds = [
    tesis.pembimbing1Id,
    tesis.pembimbing2Id,
  ].filter((x): x is string => !!x);
  const newPembimbingIds = [
    parsed.pembimbing1Id,
    parsed.pembimbing2Id || null,
  ].filter((x): x is string => !!x);
  const releasedIds = previousPembimbingIds.filter(
    (x) => !newPembimbingIds.includes(x),
  );

  await prisma.tesis.update({
    where: { id },
    data: {
      pembimbing1Id: parsed.pembimbing1Id,
      pembimbing2Id: parsed.pembimbing2Id || null,
      skBimbinganNo: nomor,
      skBimbinganDocId: doc.id,
      ...(tesis.stage === "JUDUL" ? { stage: "PROPOSAL" as const } : {}),
      timeline: {
        create: {
          stage: "SK_PEMBIMBING_ISSUED",
          note: `SK Pembimbing terbit: ${nomor}`,
          actorId: session.uid,
        },
      },
    },
  });

  const skBody = (peran: string) =>
    `Anda ditetapkan sebagai ${peran} untuk ${tesis.mahasiswa.name} (${tesis.mahasiswa.nimNip}). SK Nomor ${nomor}. Klik untuk lihat SK.`;

  await prisma.notification.createMany({
    data: [
      {
        userId: tesis.mahasiswaId,
        title: "SK Pembimbing Terbit",
        body: `SK Pembimbing tesis Anda telah diterbitkan dengan nomor ${nomor}. Pembimbing 1: ${p1.name}${p2 ? `, Pembimbing 2: ${p2.name}` : ""}.`,
        link: `/verify/${doc.code}`,
      },
      {
        userId: parsed.pembimbing1Id,
        title: "Penugasan Pembimbing 1",
        body: skBody("Pembimbing 1"),
        link: `/verify/${doc.code}`,
      },
      ...(parsed.pembimbing2Id
        ? [
            {
              userId: parsed.pembimbing2Id,
              title: "Penugasan Pembimbing 2",
              body: skBody("Pembimbing 2"),
              link: `/verify/${doc.code}`,
            },
          ]
        : []),
      ...releasedIds.map((uid) => ({
        userId: uid,
        title: "Penugasan Pembimbing Dicabut",
        body: `Anda tidak lagi menjadi pembimbing untuk ${tesis.mahasiswa.name} (${tesis.mahasiswa.nimNip}). SK pengganti: ${nomor}.`,
        link: `/verify/${doc.code}`,
      })),
    ],
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_PEMBIMBING_ASSIGN",
      entity: "Tesis",
      entityId: id,
      metadata: {
        nomor,
        nomorMode: manualNomor ? "manual" : "auto",
        pembimbing1Id: parsed.pembimbing1Id,
        pembimbing2Id: parsed.pembimbing2Id || null,
        previous: previousPembimbingIds,
      },
    },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/verify/${doc.code}`;
  return NextResponse.json({
    ok: true,
    nomor,
    code: doc.code,
    verifyUrl,
  });
}

async function getKaprodiProdiId(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { prodiId: true },
  });
  return u?.prodiId ?? null;
}
