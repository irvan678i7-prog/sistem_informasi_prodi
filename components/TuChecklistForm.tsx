"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type ItemRow = {
  no: number;
  label: string;
  file: { name: string; url: string } | null;
};

// Form ceklis ADA / TIDAK ADA berkas (diisi TU) + tombol "Sahkan & Terbitkan".
// Dipakai untuk Seminar Proposal maupun Ujian Tesis (endpoint konfigurabel).
export function TuChecklistForm({
  tesisId,
  jenis,
  items,
  initial,
  checklistEndpoint,
  approved,
  printHref,
}: {
  tesisId: string;
  jenis: "seminar" | "ujian";
  items: ItemRow[];
  initial: boolean[];
  checklistEndpoint: string;
  approved: boolean;
  printHref: string;
}) {
  const router = useRouter();
  const [checks, setChecks] = useState<boolean[]>(initial);
  const [saving, setSaving] = useState(false);
  const [accing, setAccing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function toggle(i: number, value: boolean) {
    setChecks((prev) => prev.map((c, idx) => (idx === i ? value : c)));
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(checklistEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tesisId, checklist: checks }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message || "Gagal menyimpan ceklis");
      } else {
        setMsg("Ceklis berhasil disimpan.");
        router.refresh();
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan ceklis");
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    setAccing(true);
    setErr(null);
    setMsg(null);
    try {
      // Simpan dulu agar ceklis terkini ikut disahkan, lalu terbitkan.
      const saveRes = await fetch(checklistEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tesisId, checklist: checks }),
      });
      if (!saveRes.ok) {
        const d = await saveRes.json().catch(() => ({}));
        setErr(d.message || "Gagal menyimpan ceklis");
        setAccing(false);
        return;
      }
      const res = await fetch("/api/tu/checklist/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tesisId, jenis }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message || "Gagal mengesahkan");
      } else {
        setMsg("Ceklis disahkan & dokumen resmi diterbitkan.");
        router.refresh();
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal mengesahkan");
    } finally {
      setAccing(false);
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left align-top">
              <th className="px-3 py-2 font-medium text-slate-600 w-10">No</th>
              <th className="px-3 py-2 font-medium text-slate-600">Berkas</th>
              <th className="px-3 py-2 font-medium text-slate-600 w-56">
                File Mahasiswa
              </th>
              <th className="px-3 py-2 font-medium text-slate-600 w-28">
                Ada / Tidak
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, i) => (
              <tr key={item.no} className="align-top">
                <td className="px-3 py-3 text-slate-500">{item.no}</td>
                <td className="px-3 py-3 text-slate-900">{item.label}</td>
                <td className="px-3 py-3">
                  {item.file ? (
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-600">
                      <FileText className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                      <span className="truncate max-w-[140px]">
                        {item.file.name}
                      </span>
                      <a
                        href={item.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-brand-700 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Lihat
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Belum diunggah
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <label className="inline-flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checks[i] ?? false}
                      onChange={(e) => toggle(i, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {checks[i] ? "ADA" : "TIDAK ADA"}
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-3 border-t border-slate-200 flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={saving || accing} variant="secondary">
          {saving ? "Menyimpan..." : "Simpan Ceklis"}
        </Button>
        <Button onClick={approve} disabled={saving || accing}>
          <ShieldCheck className="w-4 h-4 mr-1.5" />
          {accing ? "Menerbitkan..." : "Sahkan & Terbitkan (ACC)"}
        </Button>
        <a
          href={printHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-sm"
        >
          Lihat / Cetak Dokumen
        </a>
        {approved && (
          <span className="text-xs text-emerald-700 font-medium">
            Sudah disahkan
          </span>
        )}
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
    </div>
  );
}
