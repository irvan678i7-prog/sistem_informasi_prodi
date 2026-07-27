import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sectionLabel } from "@/lib/bimbinganArtikel";
import { deletePublicUrls } from "@/lib/storage";

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
  approved: z.boolean().default(false),
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

  // Kunci server-side: jika kolom pembimbing ini SUDAH di-ACC, tolak perubahan.
  const existingRow = await prisma.bimbinganArtikel.findUnique({
    where: {
      tesisId_section: { tesisId: parsed.tesisId, section: parsed.section },
    },
    select: { p1Approved: true, p2Approved: true },
  });
  if ((isP1 && existingRow?.p1Approved) || (isP2 && existingRow?.p2Approved))
    return NextResponse.json(
      { message: "Bagian ini sudah Anda ACC dan tidak dapat diubah lagi." },
      { status: 409 },
    );

  const note = parsed.note?.trim() || null;
  const data = isP1
    ? { p1Note: note, p1Severity: parsed.severity, p1ReviewedAt: new Date(), p1Approved: parsed.approved }
    : { p2Note: note, p2Severity: parsed.severity, p2ReviewedAt: new Date(), p2Approved: parsed.approved };

  await prisma.bimbinganArtikel.upsert({
    where: {
      tesisId_section: { tesisId: parsed.tesisId, section: parsed.section },
    },
    create: { tesisId: parsed.tesisId, section: parsed.section, ...data },
    update: data,
  });

  // Simpan komentar ke RIWAYAT (tidak pernah dihapus, termasuk setelah ACC).
  // Hanya dicatat bila ada catatan/komentar tertulis. Di-guard agar review
  // tetap berhasil walau tabel riwayat komentar belum ada di database.
  if (note) {
    try {
      await prisma.bimbinganArtikelComment.create({
        data: {
          tesisId: parsed.tesisId,
          section: parsed.section,
          peran: isP1 ? "P1" : "P2",
          dosenId: session.uid,
          dosenName: session.name,
          severity: parsed.severity,
          note,
          approved: parsed.approved,
        },
      });
    } catch (e) {
      console.error(
        "[bimbingan-artikel/review] gagal simpan riwayat komentar:",
        e,
      );
    }
  }

  // Status ACC terkini bagian ini — dipakai untuk prune file & notifikasi.
  const row = await prisma.bimbinganArtikel.findUnique({
    where: {
      tesisId_section: { tesisId: parsed.tesisId, section: parsed.section },
    },
    select: { p1Approved: true, p2Approved: true, fileUrl: true },
  });
  const bothApproved = !!(row?.p1Approved && row?.p2Approved);

  // Jika bagian ini SUDAH di-ACC oleh KEDUA pembimbing, cukup simpan 1 berkas
  // final (versi terkini) dan hapus riwayat revisi lainnya — DB + Storage
  // (best-effort). Riwayat KOMENTAR tetap utuh.
  if (parsed.approved && bothApproved) {
    const files = await prisma.bimbinganArtikelFile.findMany({
      where: { tesisId: parsed.tesisId, section: parsed.section },
      orderBy: [{ revision: "desc" }, { createdAt: "desc" }],
    });
    if (files.length > 1) {
      const keep = files.find((f) => f.fileUrl === row?.fileUrl) ?? files[0];
      const remove = files.filter((f) => f.id !== keep.id);
      if (remove.length) {
        await prisma.bimbinganArtikelFile.deleteMany({
          where: { id: { in: remove.map((f) => f.id) } },
        });
        try {
          await deletePublicUrls(
            remove.map((f) => f.fileUrl).filter((u) => u && u !== keep.fileUrl),
          );
        } catch (e) {
          console.error(
            "[bimbingan-artikel/review] gagal hapus objek storage:",
            e,
          );
        }
      }
    }
  }

  // Notifikasi. BUG LAMA: saat satu pembimbing meng-ACC, pembimbing lain tidak
  // pernah diberi tahu. Sekarang: saat ACC → mahasiswa + pembimbing LAINNYA
  // dinotifikasi; jika keduanya sudah ACC, mahasiswa dapat notif "lengkap".
  const secLabel = sectionLabel(parsed.section);
  const peran = isP1 ? "Pembimbing 1" : "Pembimbing 2";
  const notifs: Array<{
    userId: string;
    title: string;
    body: string;
    link: string;
  }> = [];
  if (parsed.approved) {
    notifs.push({
      userId: tesis.mahasiswaId,
      title: "Sub-penilaian di-ACC",
      body: `${peran} (${session.name}) menyetujui/ACC bagian "${secLabel}".`,
      link: "/tesis/bimbingan-artikel",
    });
    const otherId = isP1 ? tesis.pembimbing2Id : tesis.pembimbing1Id;
    if (otherId && otherId !== session.uid) {
      notifs.push({
        userId: otherId,
        title: "Menunggu ACC Anda",
        body: `${peran} sudah ACC bagian "${secLabel}". Mohon tinjau & ACC bagian ini.`,
        link: `/bimbingan/artikel/${parsed.tesisId}`,
      });
    }
    if (bothApproved) {
      notifs.push({
        userId: tesis.mahasiswaId,
        title: "Bagian Disetujui Lengkap",
        body: `Bagian "${secLabel}" telah disetujui kedua pembimbing.`,
        link: "/tesis/bimbingan-artikel",
      });
    }
  } else {
    notifs.push({
      userId: tesis.mahasiswaId,
      title: "Evaluasi Bimbingan Artikel",
      body: `${session.name} menilai bagian "${secLabel}".`,
      link: "/tesis/bimbingan-artikel",
    });
  }
  await prisma.notification.createMany({ data: notifs });

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
