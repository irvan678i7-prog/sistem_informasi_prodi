"use client";

import { useState } from "react";
import { FileText, Eye, EyeOff, ExternalLink } from "lucide-react";
import { previewUrl } from "@/lib/preview";

// Inline preview of an uploaded document (Word/PDF). Collapsed by default to
// keep the table compact; expands to an embedded viewer on demand.
// Word files are rendered through the Office Online viewer so dosen can read
// them inline while correcting, instead of being forced to download.
export function PdfPreview({
  url,
  name,
}: {
  url: string;
  name?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const src = previewUrl(url, name);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <FileText className="w-4 h-4 text-brand-700 shrink-0" />
        <span className="text-xs text-slate-600 truncate max-w-[160px]">
          {name || "Dokumen"}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="btn-ghost text-xs inline-flex items-center gap-1"
        >
          {open ? (
            <>
              <EyeOff className="w-3.5 h-3.5" /> Tutup
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" /> Pratinjau
            </>
          )}
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-xs inline-flex items-center gap-1"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Buka
        </a>
      </div>
      {open && (
        <iframe
          src={src}
          title={name || "Pratinjau Dokumen"}
          className="w-full h-96 rounded-md border border-slate-200"
        />
      )}
    </div>
  );
}
