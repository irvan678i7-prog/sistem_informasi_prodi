import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Alert } from "@/components/ui/alert";
import { getBimbinganArtikel } from "@/lib/bimbinganArtikel";
import { Worksheet } from "./Worksheet";
import { KartuPrint } from "./KartuPrint";
import type { RequestStatus } from "@prisma/client";

// Penjelasan status judul yang BELUM ACC, supaya mahasiswa tahu apa yang
// sedang ditunggu. ACC = judulStatus "APPROVED" (difinalisasi Kaprodi).
function judulStatusHint(status: RequestStatus): string {
  switch (status) {
    case "SUBMITTED":
      return "Judul Anda sudah diajukan dan sedang menunggu persetujuan Pembimbing Akademik (PA).";
    case "VERIFIED":
      return "Judul sudah disetujui PA dan sedang menunggu finalisasi (ACC) oleh Kaprodi.";
    case "REJECTED":
      return "Judul Anda ditolak/diminta revisi. Silakan perbaiki dan ajukan kembali.";
    default:
      return "Judul belum diajukan. Ajukan judul terlebih dahulu pada menu Pengajuan Judul.";
  }
}

// Mahasiswa view of the bimbingan artikel worksheet. Non-mahasiswa are routed
// to the pembimbing list at /bimbingan/artikel.
export default async function BimbinganArtikelPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "MAHASISWA") redirect("/bimbingan/artikel");

  // select spesifik (bukan include penuh) agar query ringan dan tidak
  // membawa kolom sensitif seperti hashedPassword.
  const tesis = await prisma.tesis.findUnique({
    where: { mahasiswaId: user.id },
    select: {
      id: true,
      track: true,
      judulFinal: true,
      judul1: true,
      judulStatus: true,
      pembimbing1Id: true,
      pembimbing1: { select: { name: true } },
      pembimbing2: { select: { name: true } },
    },
  });
  if (!tesis) redirect("/tesis");

  const trackLabel = tesis.track === "ARTIKEL" ? "Artikel" : "Tesis";

  // GATE: kartu bimbingan hanya terbuka setelah judul di-ACC (difinalisasi
  // Kaprodi). Sebelum itu mahasiswa tidak melihat lembar kerja maupun tombol
  // unggah, agar tidak ada berkas yang masuk untuk judul yang masih berubah.
  // Guard yang sama juga diterapkan di API unggah (server-side).
  if (tesis.judulStatus !== "APPROVED") {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bimbingan {trackLabel}
          </h1>
          <p className="text-sm text-slate-500">
            Kartu bimbingan terbuka setelah judul Anda di-ACC (difinalisasi
            Kaprodi).
          </p>
        </div>

        <Alert variant="warning">
          <p className="font-medium">Kartu bimbingan belum dapat diakses</p>
          <p className="mt-1">{judulStatusHint(tesis.judulStatus)}</p>
        </Alert>

        <div className="flex flex-wrap gap-2">
          <Link href="/tesis/judul" className="btn-primary">
            Lihat Pengajuan Judul
          </Link>
          <Link href="/tesis" className="btn-secondary">
            Kembali ke Tesis Saya
          </Link>
        </div>
      </div>
    );
  }

  const rows = await getBimbinganArtikel(tesis.id);

  const header = {
    nama: user.name,
    npm: user.nimNip,
    judul: tesis.judulFinal || tesis.judul1 || "(judul belum final)",
    pembimbing1: tesis.pembimbing1?.name || "(belum ditetapkan)",
    pembimbing2: tesis.pembimbing2?.name || "(belum ditetapkan)",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="print:hidden">
          <h1 className="text-2xl font-bold text-slate-900">
            Bimbingan {trackLabel}
          </h1>
          <p className="text-sm text-slate-500">
            Unggah berkas tiap bagian (1–8). Untuk mengirim revisi, cukup
            unggah ulang berkas pada bagian yang sama — berkas akan otomatis
            bertanda revisi dan pembimbing menerima notifikasi.
          </p>
        </div>
        {/* KartuPrint berisi tombol (print:hidden) + kartu versi cetak */}
        <KartuPrint track={tesis.track} header={header} rows={rows} />
      </div>

      {!tesis.pembimbing1Id && (
        <Alert variant="warning">
          Pembimbing belum ditetapkan. Anda tetap dapat mengunggah berkas;
          penilaian tersedia setelah Kaprodi menerbitkan SK Pembimbing.
        </Alert>
      )}

      <div className="print:hidden">
        <Worksheet
          tesisId={tesis.id}
          rows={rows}
          mode="mahasiswa"
          track={tesis.track}
          header={header}
        />
      </div>
    </div>
  );
}
