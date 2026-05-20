"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

function parseCSV(text: string): { headers: string[]; rows: Row[] } {
  // Simple CSV parser: split by lines, handles quoted fields with commas.
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitLine(lines[0]).map((h) => h.trim());
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    const obj: Row = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? "").trim();
    });
    rows.push(obj);
  }
  return { headers, rows };
}

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

export function BulkUploadForm({
  prodi,
}: {
  prodi: { id: string; code: string; name: string }[];
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [defaultProdiId, setDefaultProdiId] = useState("");
  const [upsert, setUpsert] = useState(false);
  const [preview, setPreview] = useState<Row[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onFile(f: File | null) {
    setErr(null);
    setResult(null);
    setPreview(null);
    setHeaders([]);
    setMissing([]);
    setFile(f);
    if (!f) return;
    try {
      const text = await f.text();
      const { headers: h, rows } = parseCSV(text);
      setHeaders(h);
      const miss = REQUIRED.filter((k) => !h.includes(k));
      setMissing(miss);
      setPreview(rows.slice(0, 10));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal membaca CSV");
    }
  }

  async function onSubmit() {
    setErr(null);
    setResult(null);
    if (!file) {
      setErr("Pilih file CSV dulu");
      return;
    }
    if (missing.length > 0) {
      setErr(`Header CSV kurang: ${missing.join(", ")}`);
      return;
    }
    setLoading(true);
    try {
      const text = await file.text();
      const { rows } = parseCSV(text);
      if (rows.length === 0) {
        setErr("CSV tidak punya baris data");
        return;
      }
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
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

      <FormRow label="File CSV" htmlFor="csv" required>
        <input
          id="csv"
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
          className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:text-white file:px-3 file:py-2 file:text-sm hover:file:bg-emerald-800 cursor-pointer"
        />
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
              Pratinjau ({preview.length} baris pertama)
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

      <Button onClick={onSubmit} disabled={loading || !file}>
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
