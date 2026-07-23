"use client";

import { useState } from "react";
import { History, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { previewUrl } from "@/lib/preview";

export type RevisionItem = {
  id: string;
  revision: number;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
};

// Riwayat revisi file Word per bagian. Setiap unggahan tersimpan sebagai
// riwayat sehingga dosen dapat membuka versi lama lewat pratinjau tanpa
// mengunduh.
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
        <ul className="space-y-1.5 border-l-2 border-slate-200 pl-2">
          {items.map((it) => (
            <li key={it.id} className="text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium">
                  {it.revision > 0
                    ? `Revisi ke-${it.revision}`
                    : "Unggahan awal"}
                </span>
                <span className="text-slate-400">{it.uploadedAt}</span>
                <a
                  href={previewUrl(it.fileUrl, it.fileName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-brand-700 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Lihat
                </a>
              </div>
              <p className="truncate max-w-[190px] text-slate-400">
                {it.fileName}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
