"use client";

import { useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

export type CommentItem = {
  id: string;
  dosenName: string;
  severity: string | null;
  note: string;
  at: string;
  approved: boolean;
};

const SEV_LABEL: Record<string, string> = {
  BAIK: "Baik",
  REVISI_RINGAN: "Revisi Ringan",
  REVISI_SEDANG: "Revisi Sedang",
  REVISI_BERAT: "Revisi Berat",
};

// Riwayat komentar pembimbing untuk satu bagian, ditampilkan bernomor (1..N,
// urut terlama → terbaru). Riwayat ini TIDAK dihapus meski bagian sudah di-ACC.
export function CommentHistory({
  items,
  title = "Riwayat komentar",
}: {
  items: CommentItem[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost text-xs inline-flex items-center gap-1"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {title} ({items.length})
        {open ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
      {open && (
        <ol className="list-decimal pl-5 ml-1 space-y-2 border-l-2 border-slate-200 pt-1">
          {items.map((it) => (
            <li key={it.id} className="text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 flex-wrap text-slate-400">
                <span className="font-medium text-slate-500">
                  {it.dosenName}
                </span>
                <span>· {it.at}</span>
                {it.severity && (
                  <span className="rounded bg-slate-100 px-1 py-0.5 text-slate-600">
                    {SEV_LABEL[it.severity] ?? it.severity}
                  </span>
                )}
                {it.approved && (
                  <span className="rounded bg-emerald-100 px-1 py-0.5 font-semibold text-emerald-700">
                    ACC
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-slate-700">{it.note}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
