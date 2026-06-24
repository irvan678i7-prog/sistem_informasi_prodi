"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import type { BimbinganSection } from "@prisma/client";

// Per-section PDF uploader for the student. Replaces any existing file for the
// section on the server (upsert).
export function SectionUpload({
  tesisId,
  section,
  hasFile,
}: {
  tesisId: string;
  section: BimbinganSection;
  hasFile: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.append("tesisId", tesisId);
      form.append("section", section);
      form.append("file", file);
      const res = await fetch("/api/tesis/bimbingan-artikel/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message || "Gagal mengunggah");
      } else {
        router.refresh();
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal mengunggah");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="btn-ghost text-xs inline-flex items-center gap-1"
      >
        <Upload className="w-3.5 h-3.5" />
        {busy ? "Mengunggah..." : hasFile ? "Ganti PDF" : "Unggah PDF"}
      </button>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
