import { redirect } from "next/navigation";
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
import {
  SEMINAR_BERKAS_ITEMS,
  SEMINAR_TEMPLATE_URL,
} from "@/lib/seminarBerkas";
import { previewUrl } from "@/lib/preview";
import { ItemUpload } from "./ItemUpload";

// Menu Seminar Proposal (mahasiswa): check list 11 berkas syarat mendaftar
// Seminar Proposal Tesis + form upload per item dan tautan unduh template.
export default async function SeminarProposalBerkasPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "MAHASISWA") redirect("/tesis/seminar");

  const tesis = await prisma.tesis.findUnique({
    where: { mahasiswaId: user.id },
    include: { seminarBerkas: true },
  });
  if (!tesis) redirect("/tesis");

  const byItem = new Map(tesis.seminarBerkas.map((b) => [b.item, b]));
  const uploaded = tesis.seminarBerkas.length;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Seminar Proposal
          </h1>
          <p className="text-sm text-slate-500">
            Check list berkas syarat untuk mendaftar Seminar Proposal Tesis.
          </p>
        </div>
        <a
          href={SEMINAR_TEMPLATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Download className="w-4 h-4" /> Download Template
        </a>
      </div>

      <Alert variant="info">
        Unggah berkas untuk setiap item di bawah. Item yang sudah diunggah
        otomatis berstatus &quot;Ada&quot;. Template berkas dapat diunduh
        melalui tombol Download Template.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Form Upload Berkas Seminar Proposal</CardTitle>
          <CardDescription>
            {uploaded} dari {SEMINAR_BERKAS_ITEMS.length} berkas telah
            diunggah.
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left align-top">
                  <th className="px-3 py-2 font-medium text-slate-600 w-10">
                    No
                  </th>
                  <th className="px-3 py-2 font-medium text-slate-600">
                    Berkas
                  </th>
                  <th className="px-3 py-2 font-medium text-slate-600 w-24">
                    Status
                  </th>
                  <th className="px-3 py-2 font-medium text-slate-600 w-56">
                    Upload / Berkas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {SEMINAR_BERKAS_ITEMS.map((label, i) => {
                  const no = i + 1;
                  const berkas = byItem.get(no);
                  return (
                    <tr key={no} className="align-top">
                      <td className="px-3 py-3 text-slate-500">{no}</td>
                      <td className="px-3 py-3 text-slate-900">{label}</td>
                      <td className="px-3 py-3">
                        {berkas ? (
                          <span className="inline-block rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-1.5 py-0.5">
                            Ada
                          </span>
                        ) : (
                          <span className="inline-block rounded bg-slate-100 text-slate-500 text-[11px] font-semibold px-1.5 py-0.5">
                            Tidak Ada
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 space-y-1">
                        {berkas && (
                          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-600">
                            <FileText className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {berkas.fileName}
                            </span>
                            <a
                              href={previewUrl(berkas.fileUrl, berkas.fileName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-brand-700 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" /> Lihat
                            </a>
                          </div>
                        )}
                        <ItemUpload
                          tesisId={tesis.id}
                          item={no}
                          hasFile={!!berkas}
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
    </div>
  );
}
