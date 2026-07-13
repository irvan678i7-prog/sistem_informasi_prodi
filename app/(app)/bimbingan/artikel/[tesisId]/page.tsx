import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Alert } from "@/components/ui/alert";
import { getBimbinganArtikel } from "@/lib/bimbinganArtikel";
import { Worksheet, type WorksheetMode } from "../../../tesis/bimbingan-artikel/Worksheet";

export default async function PembimbingWorksheetPage({
  params,
}: {
  params: Promise<{ tesisId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "MAHASISWA") redirect("/tesis/bimbingan-artikel");

  const { tesisId } = await params;
  const tesis = await prisma.tesis.findUnique({
    where: { id: tesisId },
    include: {
      mahasiswa: { include: { prodi: true } },
      pembimbing1: { select: { name: true } },
      pembimbing2: { select: { name: true } },
    },
  });
  if (!tesis) notFound();

  // Mode menentukan kolom yang dapat diedit. Pembimbing hanya mengedit kolomnya
  // sendiri; selain itu read-only (mis. Kaprodi/Admin/dosen lain).
  let mode: WorksheetMode = "readonly";
  if (tesis.pembimbing1Id === user.id) mode = "p1";
  else if (tesis.pembimbing2Id === user.id) mode = "p2";
  else if (user.role === "ADMIN") {
    mode = "readonly";
  } else if (user.role === "KAPRODI") {
    // Kaprodi hanya boleh melihat tesis di prodinya.
    if (user.prodiId && tesis.mahasiswa.prodiId !== user.prodiId) {
      redirect("/bimbingan/artikel");
    }
  } else {
    // Dosen yang bukan pembimbing tesis ini tidak berhak melihat.
    redirect("/bimbingan/artikel");
  }

  const rows = await getBimbinganArtikel(tesis.id);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Link
        href="/bimbingan/artikel"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bimbingan {tesis.track === "ARTIKEL" ? "Artikel" : "Tesis"} —{" "}
          {tesis.mahasiswa.name}
        </h1>
        <p className="text-sm text-slate-500">
          {mode === "readonly"
            ? "Mode lihat: Anda bukan pembimbing tesis ini."
            : `Anda menilai sebagai Pembimbing ${mode === "p1" ? "1" : "2"}.`}
        </p>
      </div>

      {mode === "readonly" && (
        <Alert variant="info">
          Anda dapat melihat berkas dan evaluasi, tetapi tidak dapat
          mengubahnya.
        </Alert>
      )}

      <Worksheet
        tesisId={tesis.id}
        rows={rows}
        mode={mode}
        track={tesis.track}
        header={{
          nama: tesis.mahasiswa.name,
          npm: tesis.mahasiswa.nimNip,
          judul: tesis.judulFinal || tesis.judul1 || "(judul belum final)",
          pembimbing1: tesis.pembimbing1?.name || "(belum ditetapkan)",
          pembimbing2: tesis.pembimbing2?.name || "(belum ditetapkan)",
        }}
      />
    </div>
  );
}
