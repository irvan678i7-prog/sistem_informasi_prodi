import { redirect } from "next/navigation";
import Link from "next/link";
import { Download, ExternalLink, FileText } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { CHECKLIST_CONFIG, parseChecklist, parseChecklistApproval } from "@/lib/checklist";
import { previewUrl } from "@/lib/preview";
import { BerkasUpload } from "@/components/BerkasUpload";

type BerkasRow = { id: string; item: number; fileUrl: string; fileName: string };

const config = CHECKLIST_CONFIG.ujian;

// Menu Berkas Ujian Tesis (mahasiswa): upload berkas syarat per item → dikirim
// ke TU untuk diceklis & disahkan; unduh dokumen tersahkan setelah di-ACC.
export default async function UjianBerkasPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "MAHASISWA") redirect("/tesis/kut");

  let tesisId: string | null = null;
  let tuChecks: boolean[] = [];
  let checkedByTU = false;
  let approvedCode: string | null = null;
  let databaseReady = true;
  try {
    const tesis = await prisma.tesis.findUnique({
      where: { mahasiswaId: user.id },
      select: { id: true, ujianChecklist: true, checklistApproval: true },
    });
    if (tesis) {
      tesisId = tesis.id;
      checkedByTU =
        Array.isArray(tesis.ujianChecklist) &&
        (tesis.ujianChecklist as unknown[]).length > 0;
      tuChecks = parseChecklist(tesis.ujianChecklist, "ujian");
      approvedCode =
        parseChecklistApproval(tesis.checklistApproval).ujian?.code ?? null;
    }
  } catch (error) {
    databaseReady = false;
    console.error("Kolom ujianChecklist belum tersedia:", error);
    const tesis = await prisma.tesis.findUnique({
      where: { mahasiswaId: user.id },
      select: { id: true },
    });
    if (tesis) tesisId = tesis.id;
  }
  if (!tesisId) redirect("/tesis");

  let berkas: BerkasRow[] = [];
  try {
    berkas = await prisma.ujianBerkas.findMany({
      where: { tesisId },
      select: { id: true, item: true, fileUrl: true, fileName: true },
      orderBy: { item: "asc" },
    });
  } catch (error) {
    databaseReady = false;
    console.error("Gagal memuat berkas Ujian:", error);
  }

  const byItem = new Map(berkas.map((b) => [b.item, b]));
  const uploaded = berkas.length;
  const sudahDicekTU = checkedByTU;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Berkas Ujian Tesis</h1>
          <p className="text-sm text-slate-500">
            Check list berkas syarat untuk mendaftar Ujian Tesis (KUT).
          </p>
        </div>
        {approvedCode && (
          <a
            href={`/cetak/ceklis/ujian/${tesisId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Download className="w-4 h-4" /> Unduh Ceklis Tersahkan
          </a>
        )}
      </div>

      {!databaseReady && (
        <Alert variant="warning">
          Penyimpanan berkas sedang disiapkan setelah pembaruan sistem. Halaman
          tetap dapat dibuka; silakan coba unggah kembali beberapa saat lagi.
        </Alert>
      )}

      <Alert variant="info">
        Unggah berkas untuk setiap item di bawah, lalu berkas Anda diperiksa TU.
        Setelah TU menekan &quot;Sahkan &amp; Terbitkan&quot;, tombol{" "}
        <strong>Unduh Ceklis Tersahkan</strong> akan muncul di kanan atas.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Form Upload Berkas Ujian Tesis</CardTitle>
          <CardDescription>
            {uploaded} dari {config.items.length} berkas telah diunggah.
            {sudahDicekTU &&
              " Berkas Anda sudah diperiksa oleh TU (lihat kolom Ceklis TU)."}
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left align-top">
                  <th className="px-3 py-2 font-medium text-slate-600 w-10">No</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Berkas</th>
                  <th className="px-3 py-2 font-medium text-slate-600 w-24">
                    Status
                  </th>
                  <th className="px-3 py-2 font-medium text-slate-600 w-24">
                    Ceklis TU
                  </th>
                  <th className="px-3 py-2 font-medium text-slate-600 w-56">
                    Upload / Berkas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {config.items.map((label, i) => {
                  const no = i + 1;
                  const b = byItem.get(no);
                  return (
                    <tr key={no} className="align-top">
                      <td className="px-3 py-3 text-slate-500">{no}</td>
                      <td className="px-3 py-3 text-slate-900">{label}</td>
                      <td className="px-3 py-3">
                        {b ? (
                          <span className="inline-block rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-1.5 py-0.5">
                            Ada
                          </span>
                        ) : (
                          <span className="inline-block rounded bg-slate-100 text-slate-500 text-[11px] font-semibold px-1.5 py-0.5">
                            Tidak Ada
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {sudahDicekTU ? (
                          tuChecks[i] ? (
                            <span className="inline-block rounded bg-blue-100 text-blue-800 text-[11px] font-semibold px-1.5 py-0.5">
                              &#10003; ADA
                            </span>
                          ) : (
                            <span className="inline-block rounded bg-red-100 text-red-700 text-[11px] font-semibold px-1.5 py-0.5">
                              TIDAK ADA
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 space-y-1">
                        {b && (
                          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-600">
                            <FileText className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {b.fileName}
                            </span>
                            <a
                              href={previewUrl(b.fileUrl, b.fileName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-brand-700 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" /> Lihat
                            </a>
                          </div>
                        )}
                        <BerkasUpload
                          tesisId={tesisId}
                          item={no}
                          hasFile={!!b}
                          endpoint={config.uploadEndpoint}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div>
        <Link href="/tesis/kut" className="btn-ghost text-sm">
          ← Kembali ke KUT
        </Link>
      </div>
    </div>
  );
}
