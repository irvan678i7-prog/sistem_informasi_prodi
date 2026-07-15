"use client";

import { Printer } from "lucide-react";

// Cetak / unduh surat sebagai PDF lewat dialog cetak browser
// (pilih "Save as PDF" untuk mengunduh) — ringan tanpa library tambahan.
export function CetakSuratButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-secondary inline-flex items-center gap-2"
    >
      <Printer className="w-4 h-4" aria-hidden />
      Cetak / Unduh PDF
    </button>
  );
}
