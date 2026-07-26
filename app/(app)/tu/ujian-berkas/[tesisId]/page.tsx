import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCheckSeminarBerkas } from "@/lib/rbac";
import {
  CHECKLIST_CONFIG,
  parseChecklist,
  parseChecklistApproval,
} from "@/lib/checklist";
import { previewUrl } from "@/lib/preview";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TuChecklistForm } from "@/components/TuChecklistForm";

const config = CHECKLIST_CONFIG.ujian;

// Detail cek berkas Ujian Tesis satu mahasiswa (halaman TU).
export default async function TuUjianBerkasDetailPage({
  params,
}: {
  params: { tesisId: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!canCheckSeminarBerkas(user.role)) redirect("/dashboard");

  const tesis = await prisma.tesis.findUnique({
    where: { id: params.tesisId },
    select: {
      id: true,
      judulFinal: true,
      ujianChecklist: true,
      checklistApproval: true,
      mahasiswa: { select: { name: true, nimNip: true } },
      ujianBerkas: {
        select: { item: true, fileUrl: true, fileName: true },
        orderBy: { item: "asc" },
      },
    },
  });
  if (!tesis) notFound();

  const byItem = new Map(tesis.ujianBerkas.map((b) => [b.item, b]));
  const saved = parseChecklist(tesis.ujianChecklist, "ujian");
  const rawSaved = Array.isArray(tesis.ujianChecklist)
    ? (tesis.ujianChecklist as unknown[])
    : [];
  const approved = !!parseChecklistApproval(tesis.checklistApproval).ujian;

  const items = config.items.map((label, i) => {
    const berkas = byItem.get(i + 1);
    return {
      no: i + 1,
      label,
      file: berkas
        ? { name: berkas.fileName, url: previewUrl(berkas.fileUrl, berkas.fileName) }
        : null,
    };
  });

  // Nilai awal ceklis: pakai tersimpan; jika belum, default ikut ada/tidaknya berkas.
  const initial = config.items.map((_, i) =>
    typeof rawSaved[i] === "boolean" ? saved[i] : byItem.has(i + 1),
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cek Berkas Ujian: {tesis.mahasiswa.name}
          </h1>
          <p className="text-sm text-slate-500">
            {tesis.mahasiswa.nimNip}
            {tesis.judulFinal ? " — " + tesis.judulFinal : ""}
          </p>
        </div>
        <Link href="/tu/ujian-berkas" className="btn-ghost">
          Kembali
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check List Berkas Syarat Ujian Tesis</CardTitle>
          <CardDescription>
            Klik &quot;Lihat&quot; untuk memeriksa berkas, ceklis ADA / TIDAK
            ADA, lalu Sahkan &amp; Terbitkan untuk membuat dokumen ber-TTD.
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          <TuChecklistForm
            tesisId={tesis.id}
            jenis="ujian"
            items={items}
            initial={initial}
            checklistEndpoint={config.tuChecklistEndpoint}
            approved={approved}
            printHref={`/cetak/ceklis/ujian/${tesis.id}`}
          />
        </CardBody>
      </Card>
    </div>
  );
}
