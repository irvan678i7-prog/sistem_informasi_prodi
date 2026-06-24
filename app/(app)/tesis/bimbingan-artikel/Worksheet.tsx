import { Card, CardBody } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import type { BimbinganArtikelRows } from "@/lib/bimbinganArtikel";
import type { RevisiSeverity } from "@prisma/client";
import { PdfPreview } from "./PdfPreview";
import { SectionUpload } from "./SectionUpload";
import { SectionReview } from "./SectionReview";

// Who is viewing the worksheet, which decides what is editable:
// - "mahasiswa": may upload a PDF per section
// - "p1" / "p2": may edit their own evaluation column
// - "readonly": kaprodi/admin/other dosen — view only
export type WorksheetMode = "mahasiswa" | "p1" | "p2" | "readonly";

export function Worksheet({
  tesisId,
  rows,
  header,
  mode,
}: {
  tesisId: string;
  rows: BimbinganArtikelRows;
  header: {
    nama: string;
    npm: string;
    judul: string;
    pembimbing1: string;
    pembimbing2: string;
  };
  mode: WorksheetMode;
}) {
  return (
    <Card>
      <CardBody className="p-0">
        {/* Auto-filled identity header */}
        <div className="px-5 py-4 border-b border-slate-200 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <HeaderRow k="Nama" v={header.nama} />
          <HeaderRow k="NPM" v={header.npm} />
          <HeaderRow k="Pembimbing 1" v={header.pembimbing1} />
          <HeaderRow k="Pembimbing 2" v={header.pembimbing2} />
          <div className="sm:col-span-2">
            <HeaderRow k="Judul" v={header.judul} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left align-top">
                <th className="px-3 py-2 font-medium text-slate-600 w-10">
                  No
                </th>
                <th className="px-3 py-2 font-medium text-slate-600 w-44">
                  Bagian
                </th>
                <th className="px-3 py-2 font-medium text-slate-600 w-56">
                  Berkas Mahasiswa
                </th>
                <th className="px-3 py-2 font-medium text-slate-600">
                  Pembimbing 1
                </th>
                <th className="px-3 py-2 font-medium text-slate-600">
                  Pembimbing 2
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map(({ meta, row }) => (
                <tr key={meta.section} className="align-top">
                  <td className="px-3 py-3 text-slate-500">{meta.no}</td>
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {meta.label}
                  </td>

                  {/* Student file + upload */}
                  <td className="px-3 py-3 space-y-2">
                    {row.fileUrl ? (
                      <PdfPreview url={row.fileUrl} name={row.fileName} />
                    ) : (
                      <p className="text-xs text-slate-400">Belum ada berkas</p>
                    )}
                    {mode === "mahasiswa" && (
                      <SectionUpload
                        tesisId={tesisId}
                        section={meta.section}
                        hasFile={!!row.fileUrl}
                      />
                    )}
                  </td>

                  {/* Pembimbing 1 column */}
                  <td className="px-3 py-3">
                    {mode === "p1" ? (
                      <SectionReview
                        tesisId={tesisId}
                        section={meta.section}
                        initialSeverity={row.p1Severity}
                        initialNote={row.p1Note}
                      />
                    ) : (
                      <Evaluation
                        severity={row.p1Severity}
                        note={row.p1Note}
                        reviewedAt={row.p1ReviewedAt}
                      />
                    )}
                  </td>

                  {/* Pembimbing 2 column */}
                  <td className="px-3 py-3">
                    {mode === "p2" ? (
                      <SectionReview
                        tesisId={tesisId}
                        section={meta.section}
                        initialSeverity={row.p2Severity}
                        initialNote={row.p2Note}
                      />
                    ) : (
                      <Evaluation
                        severity={row.p2Severity}
                        note={row.p2Note}
                        reviewedAt={row.p2ReviewedAt}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function HeaderRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <span className="text-slate-500">{k}</span>
      <span className="text-slate-900 font-medium">{v || "-"}</span>
    </div>
  );
}

function Evaluation({
  severity,
  note,
  reviewedAt,
}: {
  severity: RevisiSeverity | null;
  note: string | null;
  reviewedAt: Date | null;
}) {
  if (!severity && !note) {
    return <p className="text-xs text-slate-400">Belum dinilai</p>;
  }
  return (
    <div className="space-y-1">
      {severity && <SeverityBadge severity={severity} />}
      {note && <p className="text-xs text-slate-700 whitespace-pre-wrap">{note}</p>}
      {reviewedAt && (
        <p className="text-[11px] text-slate-400">{formatDate(reviewedAt)}</p>
      )}
    </div>
  );
}
