"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertTriangle } from "lucide-react";
import { Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/status-badge";
import { SEVERITY_OPTIONS } from "@/lib/bimbinganArtikel";
import type { BimbinganSection, RevisiSeverity } from "@prisma/client";

// Editor inline yang dipakai pembimbing untuk mencatat skala revisi + catatan
// pada kolomnya sendiri. Setelah bagian di-ACC, kolom TERKUNCI (tidak bisa
// diisi lagi). Sebelum meng-ACC, muncul konfirmasi di tengah layar.
export function SectionReview({
  tesisId,
  section,
  initialSeverity,
  initialNote,
  initialApproved,
}: {
  tesisId: string;
  section: BimbinganSection;
  initialSeverity: RevisiSeverity | null;
  initialNote: string | null;
  initialApproved: boolean;
}) {
  const router = useRouter();
  const [severity, setSeverity] = useState<string>(initialSeverity ?? "");
  const [approved, setApproved] = useState(false);
  const [note, setNote] = useState(initialNote ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Bagian sudah di-ACC oleh pembimbing ini → tampilkan versi terkunci.
  if (initialApproved) {
    return (
      <div className="space-y-1.5 rounded-md border border-emerald-200 bg-emerald-50/50 p-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
          <Lock className="w-3.5 h-3.5" /> Sudah di-ACC (terkunci)
        </div>
        {initialSeverity && <SeverityBadge severity={initialSeverity} />}
        {initialNote && (
          <p className="font-handwriting text-lg leading-snug text-slate-800 whitespace-pre-wrap">
            {initialNote}
          </p>
        )}
      </div>
    );
  }

  async function doSave(doApprove: boolean) {
    setErr(null);
    setBusy(true);
    setSaved(false);
    try {
      const res = await fetch("/api/tesis/bimbingan-artikel/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tesisId,
          section,
          severity,
          note,
          approved: doApprove,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message || "Gagal menyimpan");
      } else {
        setSaved(true);
        setConfirmOpen(false);
        router.refresh();
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  function onSaveClick() {
    if (!severity) {
      setErr("Pilih skala revisi");
      return;
    }
    setErr(null);
    if (approved) setConfirmOpen(true); // minta konfirmasi sebelum mengunci
    else doSave(false);
  }

  return (
    <div className="space-y-2">
      <Select
        aria-label="Skala revisi"
        value={severity}
        onChange={(e) => {
          setSeverity(e.target.value);
          setSaved(false);
        }}
        className="text-xs"
      >
        <option value="">— skala —</option>
        {SEVERITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <Textarea
        aria-label="Catatan"
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        placeholder="Catatan untuk bagian ini..."
        className="text-xs min-h-[60px]"
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
        />
        ACC sub-penilaian (mengunci)
      </label>
      <Button size="sm" onClick={onSaveClick} disabled={busy}>
        {busy ? "Menyimpan..." : saved ? "Tersimpan ✓" : "Simpan penilaian"}
      </Button>

      {/* Konfirmasi di tengah layar sebelum ACC (mengunci bagian). */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-semibold text-slate-900">Konfirmasi ACC</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Setelah di-ACC, penilaian bagian ini{" "}
                  <strong>tidak dapat diubah lagi</strong>. Lanjutkan?
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
              >
                Batal
              </Button>
              <Button size="sm" onClick={() => doSave(true)} disabled={busy}>
                {busy ? "Menyimpan..." : "Ya, ACC & Kunci"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
