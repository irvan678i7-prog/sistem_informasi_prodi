"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type RowResult = {
  nim: string;
  nama: string;
  pa: string;
  p1: string;
  p2: string;
  paNama: string | null;
  p1Nama: string | null;
  p2Nama: string | null;
  status: "ok" | "dilewati" | "error";
  message: string;
};

const STATUS_BADGE: Record<RowResult["status"], string> = {
  ok: "bg-emerald-100 text-emerald-800",
  dilewati: "bg-slate-100 text-slate-500",
  error: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<RowResult["status"], string> = {
  ok: "Siap disimpan",
  dilewati: "Dilewati",
  error: "Gagal",
};

const STATUS_LABEL_FINAL: Record<RowResult["status"], string> = {
  ok: "Berhasil",
  dilewati: "Dilewati",
  error: "Gagal",
};

async function safeJson(res: Response): Promise<{
  message?: string;
  updated?: number;
  rows?: RowResult[];
  results?: RowResult[];
}> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function ResultTable({
  rows,
  labels,
}: {
  rows: RowResult[];
  labels: Record<RowResult["status"], string>;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium text-slate-600 w-28">NIM</th>
            <th className="px-3 py-2 font-medium text-slate-600">Nama</th>
            <th className="px-3 py-2 font-medium text-slate-600">PA</th>
            <th className="px-3 py-2 font-medium text-slate-600">
              Pembimbing 1
            </th>
            <th className="px-3 py-2 font-medium text-slate-600">
              Pembimbing 2
            </th>
            <th className="px-3 py-2 font-medium text-slate-600 w-28">
              Status
            </th>
            <th className="px-3 py-2 font-medium text-slate-600">
              Keterangan
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              <td className="px-3 py-2 text-slate-500">{r.nim}</td>
              <td className="px-3 py-2 text-slate-900">{r.nama}</td>
              <td className="px-3 py-2 text-slate-700">
                {r.paNama ?? (r.pa || "—")}
              </td>
              <td className="px-3 py-2 text-slate-700">
                {r.p1Nama ?? (r.p1 || "—")}
              </td>
              <td className="px-3 py-2 text-slate-700">
                {r.p2Nama ?? (r.p2 || "—")}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block rounded text-[11px] font-semibold px-1.5 py-0.5 ${STATUS_BADGE[r.status]}`}
                >
                  {labels[r.status]}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-600">{r.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BulkUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<RowResult[] | null>(null);
  const [finalResults, setFinalResults] = useState<RowResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  async function onPreview(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErr("Pilih file terlebih dahulu.");
      return;
    }
    setLoading(true);
    setErr(null);
    setSummary(null);
    setFinalResults(null);
    setPreview(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/tesis/pembimbing/bulk/preview", {
        method: "POST",
        body: fd,
      });
      const data = await safeJson(res);
      if (!res.ok) {
        setErr(data.message || `Gagal (${res.status})`);
        return;
      }
      setPreview(data.rows ?? []);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal memproses file");
    } finally {
      setLoading(false);
    }
  }

  async function onConfirm() {
    if (!preview) return;
    setLoading(true);
    setErr(null);
    try {
      const rows = preview.map((r) => ({
        nim: r.nim,
        nama: r.nama,
        pa: r.pa,
        p1: r.p1,
        p2: r.p2,
      }));
      const res = await fetch("/api/tesis/pembimbing/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        setErr(data.message || `Gagal (${res.status})`);
        return;
      }
      setFinalResults(data.results ?? []);
      setSummary(
        `${data.updated ?? 0} mahasiswa berhasil disimpan. Notifikasi otomatis dikirim ke mahasiswa dan dosen terkait.`,
      );
      setPreview(null);
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  }

  const okCount = preview?.filter((r) => r.status === "ok").length ?? 0;
  const skipCount = preview?.filter((r) => r.status === "dilewati").length ?? 0;
  const errorCount = preview?.filter((r) => r.status === "error").length ?? 0;

  return (
    <div className="space-y-3">
      <form onSubmit={onPreview} className="space-y-3">
        {err && <Alert variant="error">{err}</Alert>}
        {summary && <Alert variant="success">{summary}</Alert>}
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        <Button type="submit" disabled={loading || !file}>
          <Upload className="w-4 h-4 mr-1.5" />
          {loading && !preview ? "Membaca file..." : "Upload & Preview"}
        </Button>
      </form>

      {preview && (
        <div className="space-y-3">
          <Alert variant="info">
            Ini baru pratinjau — belum ada data yang disimpan. Periksa hasil
            pembacaan file di bawah, lalu klik Konfirmasi & Simpan.
          </Alert>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-emerald-700">
              {okCount} siap disimpan
            </span>
            {" · "}
            <span className="text-slate-500">{skipCount} dilewati</span>
            {" · "}
            <span className="text-red-600">{errorCount} gagal</span>
          </p>
          <ResultTable rows={preview} labels={STATUS_LABEL} />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={onConfirm}
              disabled={loading || okCount === 0}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {loading
                ? "Menyimpan..."
                : `Konfirmasi & Simpan (${okCount})`}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPreview(null);
                setErr(null);
              }}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-1.5" /> Batal
            </Button>
          </div>
        </div>
      )}

      {finalResults && finalResults.length > 0 && (
        <ResultTable rows={finalResults} labels={STATUS_LABEL_FINAL} />
      )}
    </div>
  );
}
