import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Alert } from "@/components/ui/alert";
import { getBimbinganArtikel } from "@/lib/bimbinganArtikel";
import { Worksheet } from "./Worksheet";

// Mahasiswa view of the bimbingan artikel worksheet. Non-mahasiswa are routed
// to the pembimbing list at /bimbingan/artikel.
export default async function BimbinganArtikelPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "MAHASISWA") redirect("/bimbingan/artikel");

  const tesis = await prisma.tesis.findUnique({
    where: { mahasiswaId: user.id },
    include: { pembimbing1: true, pembimbing2: true },
  });
  if (!tesis) redirect("/tesis");

  const rows = await getBimbinganArtikel(tesis.id);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bimbingan Artikel / Tesis
        </h1>
        <p className="text-sm text-slate-500">
          Unggah berkas tiap bagian (1–8). Pembimbing 1 &amp; 2 akan menilai dan
          memberi catatan revisi per bagian.
        </p>
      </div>

      {!tesis.pembimbing1Id && (
        <Alert variant="warning">
          Pembimbing belum ditetapkan. Anda tetap dapat mengunggah berkas;
          penilaian tersedia setelah Kaprodi menerbitkan SK Pembimbing.
        </Alert>
      )}

      <Worksheet
        tesisId={tesis.id}
        rows={rows}
        mode="mahasiswa"
        header={{
          nama: user.name,
          npm: user.nimNip,
          judul: tesis.judulFinal || tesis.judul1 || "(judul belum final)",
          pembimbing1: tesis.pembimbing1?.name || "(belum ditetapkan)",
          pembimbing2: tesis.pembimbing2?.name || "(belum ditetapkan)",
        }}
      />
    </div>
  );
}
