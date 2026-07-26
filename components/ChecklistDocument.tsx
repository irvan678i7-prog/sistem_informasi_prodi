import { Check } from "lucide-react";
import { FormKop } from "@/components/FormKop";

export interface ChecklistDocRow {
  no: number;
  label: string;
  ada: boolean;
}

/**
 * Dokumen resmi "Check List Berkas Syarat" siap-cetak (A4), dipakai untuk
 * Seminar Proposal maupun Ujian Tesis. Ditampilkan hitam-di-atas-putih supaya
 * hasil Print / Save-as-PDF rapi. Blok tanda tangan TU terisi otomatis (nama +
 * gambar TTD bila ada) beserta QR verifikasi ketika sudah disahkan.
 */
export function ChecklistDocument({
  title,
  mahasiswa,
  rows,
  approved,
  signerName,
  approvedAtLabel,
  ttdImageUrl,
  qrUrl,
  verifyUrl,
  code,
}: {
  title: string;
  mahasiswa: { name: string; nimNip: string; prodi: string | null };
  rows: ChecklistDocRow[];
  approved: boolean;
  signerName?: string | null;
  approvedAtLabel?: string | null;
  ttdImageUrl?: string | null;
  qrUrl?: string | null;
  verifyUrl?: string | null;
  code?: string | null;
}) {
  return (
    <div className="mx-auto max-w-[820px] bg-white text-slate-900 p-8 print:p-0">
      <FormKop />

      <div className="text-center mb-4">
        <h1 className="text-base font-bold uppercase leading-snug text-balance">
          {title}
        </h1>
        <p className="text-sm font-semibold uppercase">
          Program Pascasarjana UM Metro
        </p>
      </div>

      <div className="text-sm space-y-0.5 mb-3">
        <div className="grid grid-cols-[130px_10px_1fr]">
          <span>Nama</span>
          <span>:</span>
          <span className="font-medium">{mahasiswa.name}</span>
        </div>
        <div className="grid grid-cols-[130px_10px_1fr]">
          <span>NPM</span>
          <span>:</span>
          <span className="font-medium">{mahasiswa.nimNip}</span>
        </div>
        <div className="grid grid-cols-[130px_10px_1fr]">
          <span>Program Studi</span>
          <span>:</span>
          <span className="font-medium">{mahasiswa.prodi || "-"}</span>
        </div>
      </div>

      <table className="w-full border-collapse text-sm [&_th]:border [&_th]:border-slate-900 [&_th]:p-1.5 [&_td]:border [&_td]:border-slate-900 [&_td]:p-1.5 [&_td]:align-top">
        <thead>
          <tr className="text-center">
            <th className="w-10">NO</th>
            <th>BERKAS</th>
            <th className="w-14">ADA</th>
            <th className="w-20">TIDAK ADA</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.no}>
              <td className="text-center">{row.no}</td>
              <td>{row.label}</td>
              <td className="text-center">
                {row.ada && <Check className="w-4 h-4 inline-block" />}
              </td>
              <td className="text-center">
                {!row.ada && <Check className="w-4 h-4 inline-block" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-slate-600 mt-2">
        Keterangan: ceklis diisi oleh TU; setelah lengkap dan disahkan, dokumen
        ini menjadi bukti kelengkapan berkas.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p>Mahasiswa,</p>
          <div className="h-20" />
          <p className="font-medium border-t border-slate-400 pt-1 inline-block min-w-[180px]">
            {mahasiswa.name}
          </p>
          <p className="text-slate-600">NPM. {mahasiswa.nimNip}</p>
        </div>
        <div className="text-right">
          <p>{approvedAtLabel ? `Metro, ${approvedAtLabel}` : "Metro,"}</p>
          <p>Petugas TU,</p>
          <div className="h-20 flex items-center justify-end">
            {approved && ttdImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={ttdImageUrl}
                alt="Tanda tangan TU"
                className="max-h-20 object-contain"
              />
            ) : null}
          </div>
          <p className="font-medium border-t border-slate-400 pt-1 inline-block min-w-[180px]">
            {approved ? signerName || "( Petugas TU )" : "( ......................... )"}
          </p>
        </div>
      </div>

      {approved && (qrUrl || code) && (
        <div className="mt-8 flex items-center gap-3 border-t border-slate-300 pt-3">
          {qrUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={qrUrl} alt="QR Verifikasi" className="w-20 h-20" />
          )}
          <div className="text-xs text-slate-600">
            <p className="font-semibold text-slate-800">
              Dokumen ditandatangani secara elektronik &amp; dapat diverifikasi.
            </p>
            {code && (
              <p>
                Kode Verifikasi: <span className="font-mono">{code}</span>
              </p>
            )}
            {verifyUrl && <p className="break-all">{verifyUrl}</p>}
          </div>
        </div>
      )}

      {!approved && (
        <div className="mt-6 rounded border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-800 print:hidden">
          Dokumen ini <strong>belum disahkan</strong> oleh TU. Tanda tangan &amp;
          QR verifikasi akan muncul setelah TU menekan &quot;Sahkan &amp;
          Terbitkan&quot;.
        </div>
      )}
    </div>
  );
}
