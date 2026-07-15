"use client";

import { Printer } from "lucide-react";

// Tombol cetak kartu bimbingan — memakai dialog cetak browser sehingga
// tidak perlu library PDF (ringan, tanpa dependensi tambahan).
export function CetakButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-secondary print:hidden inline-flex items-center gap-2"
    >
      <Printer className="w-4 h-4" aria-hidden />
      Cetak Kartu
    </button>
  );
}
