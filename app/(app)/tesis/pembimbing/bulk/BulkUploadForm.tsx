"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type RowResult = {
  nim: string;
  nama: string;
  status: "ok" | "dilewati" | "error";
  message: string;
};

const STATUS_BADGE: Record<RowResult["status"], string> = {
  ok: "bg-emerald-100 text-emerald-800",
  dilewati: "bg-slate-100 text-slate-500",
  error: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<RowResult["status"], string> = {
  ok: "Berhasil",
  dilewati: "Dilewati",
  error: "Gagal",
};

export function BulkUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [results, setResults] = useState<RowResult[]>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErr("Pilih file CSV terlebih dahulu.");
      return;
    }
    setLoading(true);
    setErr(null);
    setSummary(null);
    setResults([]);
    try {
      const csv = await file.text();
      const res = await fetch("/api/tesis/pembimbing/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const text = await res.text();
      let data: {
        message?: string;
        updated?: number;
        results?: RowResult[];
      } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        setErr(data.message || `Gagal (${res.status})`);
        setLoading(false);
        return;
      }
      setSummary(
        `${data.updated ?? 0} mahasiswa berhasil diperbarui. Notifikasi otomatis dikirim ke mahasiswa dan dosen pembimbing.`,
      );
      setResults(data.results ?? []);
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal memproses file");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="space-y-3">
        {err && <Alert variant="error">{err}</Alert>}
        {summary && <Alert variant="success">{summary}</Alert>}
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        <Button type="submit" disabled={loading || !file}>
          <Upload className="w-4 h-4 mr-1.5" />
          {loading ? "Memproses..." : "Upload & Proses"}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium text-slate-600 w-32">
                  NIM
                </th>
                <th className="px-3 py-2 font-medium text-slate-600">Nama</th>
                <th className="px-3 py-2 font-medium text-slate-600 w-24">
                  Status
                </th>
                <th className="px-3 py-2 font-medium text-slate-600">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {results.map((r, i) => (
                <tr key={i} className="align-top">
                  <td className="px-3 py-2 text-slate-500">{r.nim}</td>
                  <td className="px-3 py-2 text-slate-900">{r.nama}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded text-[11px] font-semibold px-1.5 py-0.5 ${STATUS_BADGE[r.status]}`}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{r.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
