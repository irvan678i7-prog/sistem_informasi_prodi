"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

// Unggah berkas syarat Seminar Proposal per item check list.
export function ItemUpload({
  tesisId,
  item,
  hasFile,
}: {
  tesisId: string;
  item: number;
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
    if (file.size > 10 * 1024 * 1024) {
      setErr("Ukuran file melebihi batas maksimal 10MB");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("tesisId", tesisId);
      form.append("item", String(item));
      form.append("file", file);
      const res = await fetch("/api/tesis/seminar-proposal/upload", {
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
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
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
        {busy ? "Mengunggah..." : hasFile ? "Ganti Berkas" : "Unggah Berkas"}
      </button>
      <p className="text-[11px] text-slate-400">Maks. 10MB (PDF/DOC/JPG/PNG)</p>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
