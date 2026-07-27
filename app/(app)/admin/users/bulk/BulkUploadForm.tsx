"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, FormRow } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

type Row = Record<string, string>;
type Result = {
  ok: boolean;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; nim?: string; message: string }>;
};

const REQUIRED = ["nim", "name"];

export function BulkUploadForm({
  prodi,
}: {
  prodi: { id: string; code: string; name: string }[];
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [defaultProdiId, setDefaultProdiId] = useState("");
  const [upsert, setUpsert] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [preview, setPreview] = useState<Row[] | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  // Kirim file ke server untuk dibaca (Excel/CSV) → { headers, rows }.
  async function onFile(f: File | null) {
    setErr(null);
    setResult(null);
    setPreview(null);
    setHeaders([]);
    setMissing([]);
    setAllRows([]);
    setFile(f);
    if (!f) return;
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin/users/bulk/parse", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message || "Gagal membaca file");
        return;
      }
      const h: string[] = data.headers ?? [];
      const rows: Row[] = data.rows ?? [];
      setHeaders(h);
      setAllRows(rows);
      setPreview(rows.slice(0, 10));
      setMissing(REQUIRED.filter((k) => !h.includes(k)));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal membaca file");
    } finally {
      setParsing(false);
    }
  }

  async function onSubmit() {
    setErr(null);
    setResult(null);
    if (!file) {
      setErr("Pilih file Excel (.xlsx) atau CSV dulu");
      return;
    }
    if (missing.length > 0) {
      setErr(`Header kurang: ${missing.join(", ")}`);
      return;
    }
    if (allRows.length === 0) {
      setErr("Tidak ada baris data");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: allRows,
          upsert,
          defaultProdiId: defaultProdiId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || `Gagal (${res.status})`);
        return;
      }
      setResult(data as Result);
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {err && <Alert variant="error">{err}</Alert>}

      <a
        href="/api/admin/users/bulk/template"
        className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        <Download className="w-4 h-4" /> Download Template Excel (.xlsx)
      </a>

      <FormRow label="File Excel (.xlsx) atau CSV" htmlFor="upl" required>
        <input
          id="upl"
          type="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
          className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:text-white file:px-3 file:py-2 file:text-sm hover:file:bg-brand-700 cursor-pointer"
        />
        {parsing && (
          <p className="mt-1 text-xs text-slate-500">Membaca file…</p>
        )}
      </FormRow>

      <FormRow
        label="Default Prodi (jika baris tidak isi prodiCode)"
        htmlFor="dp"
      >
        <Select
          id="dp"
          value={defaultProdiId}
          onChange={(e) => setDefaultProdiId(e.target.value)}
        >
          <option value="">— tanpa prodi default —</option>
          {prodi.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </Select>
      </FormRow>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={upsert}
          onChange={(e) => setUpsert(e.target.checked)}
        />
        Mode update: kalau NIM/email sudah ada, update datanya & reset password
        ke NIM. (Default: lewati baris duplikat)
      </label>

      {preview && (
        <div className="rounded-md border border-slate-200">
          <div className="px-4 py-2 bg-slate-50 text-sm flex items-center justify-between border-b border-slate-200">
            <span className="font-medium">
              Pratinjau ({preview.length} dari {allRows.length} baris)
            </span>
            <span
              className={
                missing.length === 0 ? "text-emerald-700" : "text-red-700"
              }
            >
              {missing.length === 0
                ? "Header lengkap"
                : `Header kurang: ${missing.join(", ")}`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h}
                      className={`px-3 py-2 text-left ${REQUIRED.includes(h) ? "text-emerald-700" : "text-slate-600"}`}
                    >
                      {h}
                      {REQUIRED.includes(h) && " *"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.map((r, i) => (
                  <tr key={i}>
                    {headers.map((h) => (
                      <td key={h} className="px-3 py-1.5">
                        {r[h] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Button onClick={onSubmit} disabled={loading || parsing || !file}>
        <Upload className="w-4 h-4 mr-1.5" />
        {loading ? "Mengunggah..." : "Unggah & Buat Akun"}
      </Button>

      {result && (
        <Alert variant={result.errors.length > 0 ? "warning" : "success"}>
          <div className="space-y-1">
            <p className="font-semibold">
              Total: {result.total} · Dibuat: {result.created} · Diupdate:{" "}
              {result.updated} · Dilewati: {result.skipped} · Gagal:{" "}
              {result.errors.length}
            </p>
            {result.errors.length > 0 && (
              <details>
                <summary className="cursor-pointer text-xs">
                  Lihat detail error
                </summary>
                <ul className="mt-1 text-xs space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      Baris {e.row}
                      {e.nim ? ` (${e.nim})` : ""}: {e.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <p className="text-xs">
              Mahasiswa baru bisa langsung login dengan NIM sebagai username dan
              password.
            </p>
          </div>
        </Alert>
      )}
    </div>
  );
}
