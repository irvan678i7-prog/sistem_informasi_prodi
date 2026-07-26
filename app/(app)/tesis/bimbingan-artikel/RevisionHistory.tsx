"use client";

import { useState } from "react";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import { PdfPreview } from "./PdfPreview";

export type RevisionItem = {
  id: string;
  revision: number;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
};

// Riwayat revisi file Word per bagian. Setiap unggahan bisa dipratinjau inline
// (iframe Office/PDF) maupun dibuka di tab baru — sama seperti berkas terkini,
// sehingga dosen/mahasiswa tak perlu mengunduh untuk melihat versi lama.
export function RevisionHistory({ items }: { items: RevisionItem[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost text-xs inline-flex items-center gap-1"
      >
        <History className="w-3.5 h-3.5" />
        Riwayat revisi ({items.length})
        {open ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
      {open && (
        <ul className="space-y-2 border-l-2 border-slate-200 pl-3">
          {items.map((it) => (
            <li key={it.id} className="text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium">
                  {it.revision > 0
                    ? `Revisi ke-${it.revision}`
                    : "Unggahan awal"}
                </span>
                <span className="text-slate-400">{it.uploadedAt}</span>
              </div>
              {/* Pratinjau inline + tombol buka, identik dengan berkas terkini */}
              <PdfPreview url={it.fileUrl} name={it.fileName} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
