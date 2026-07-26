"use client";

import { Printer } from "lucide-react";

/** Tombol kecil untuk memicu dialog cetak/simpan-PDF bawaan browser. */
export function PrintButton({ label = "Cetak / Simpan PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}
