"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SEVERITY_OPTIONS } from "@/lib/bimbinganArtikel";
import type { BimbinganSection, RevisiSeverity } from "@prisma/client";

// Inline editor a pembimbing uses to record the severity + note for one section
// in their own column.
export function SectionReview({
  tesisId,
  section,
  initialSeverity,
  initialNote,
}: {
  tesisId: string;
  section: BimbinganSection;
  initialSeverity: RevisiSeverity | null;
  initialNote: string | null;
}) {
  const router = useRouter();
  const [severity, setSeverity] = useState<string>(initialSeverity ?? "");
  const [approved, setApproved] = useState(false);
  const [note, setNote] = useState(initialNote ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!severity) {
      setErr("Pilih skala revisi");
      return;
    }
    setErr(null);
    setBusy(true);
    setSaved(false);
    try {
      const res = await fetch("/api/tesis/bimbingan-artikel/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tesisId, section, severity, note, approved }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message || "Gagal menyimpan");
      } else {
        setSaved(true);
        router.refresh();
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
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
        <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
        ACC sub-penilaian
      </label>
      <Button size="sm" onClick={save} disabled={busy}>
        {busy ? "Menyimpan..." : saved ? "Tersimpan ✓" : "Simpan penilaian"}
      </Button>
    </div>
  );
}
