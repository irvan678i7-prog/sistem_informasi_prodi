"use client";

import { useState } from "react";
import { Printer, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { BimbinganArtikelRows } from "@/lib/bimbinganArtikel";

type Pilihan = "P1" | "P2";

// Tombol cetak + kartu bimbingan versi cetak dalam satu komponen client,
// sehingga pengguna bisa memilih mencetak catatan Pembimbing 1 atau 2.
// Memakai dialog cetak browser (bisa "Save as PDF") — tanpa library tambahan.
export function KartuPrint({
  track,
  header,
  rows,
}: {
  track: string;
  header: {
    nama: string;
    npm: string;
    judul: string;
    pembimbing1: string;
    pembimbing2: string;
  };
  rows: BimbinganArtikelRows;
}) {
  const [pilihan, setPilihan] = useState<Pilihan>("P1");
  const [open, setOpen] = useState(false);

  function cetak(p: Pilihan) {
    setPilihan(p);
    setOpen(false);
    // Beri waktu render ulang kartu sebelum dialog cetak terbuka.
    setTimeout(() => window.print(), 100);
  }

  // Ambil hanya catatan pembimbing yang dipilih, urut sesuai bagian 1-8.
  const entries = rows.flatMap(({ meta, row }) => {
    const note = pilihan === "P1" ? row.p1Note : row.p2Note;
    const tanggal = pilihan === "P1" ? row.p1ReviewedAt : row.p2ReviewedAt;
    if (!note) return [];
    return [{ tanggal, saran: `${meta.label}: ${note}` }];
  });

  const namaPembimbing =
    pilihan === "P1" ? header.pembimbing1 : header.pembimbing2;

  return (
    <>
      {/* Tombol pilihan cetak */}
      <div className="relative print:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-secondary inline-flex items-center gap-2"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Printer className="w-4 h-4" aria-hidden />
          Cetak Kartu
          <ChevronDown className="w-4 h-4" aria-hidden />
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => cetak("P1")}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              Cetak — Pembimbing 1
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => cetak("P2")}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              Cetak — Pembimbing 2
            </button>
          </div>
        )}
      </div>

      {/* Kartu versi cetak — hanya tampil saat mencetak */}
      <div className="kartu-cetak hidden print:block">
        <h3 className="kartu-judul">
          KARTU BIMBINGAN {track === "ARTIKEL" ? "ARTIKEL" : "TESIS"}
        </h3>

        <ol className="kartu-meta">
          <li>
            <span className="kartu-label">Judul yang diusulkan</span>
            <span className="kartu-label"> : </span>
            <span className="font-handwriting kartu-isi">
              {header.judul || "-"}
            </span>
          </li>
          <li>
            <span className="kartu-label">Saran Dosen Pembimbing</span>
            <span className="kartu-label"> : </span>
            <span className="font-handwriting kartu-isi">
              {namaPembimbing || "-"}
            </span>
          </li>
        </ol>

        <table className="kartu-tabel">
          <thead>
            <tr>
              <th style={{ width: "36px" }}>No</th>
              <th style={{ width: "90px" }}>Tanggal</th>
              <th>Saran</th>
              <th style={{ width: "70px" }}>Paraf</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "#666" }}>
                  Belum ada catatan bimbingan dari{" "}
                  {pilihan === "P1" ? "Pembimbing 1" : "Pembimbing 2"}
                </td>
              </tr>
            ) : (
              entries.map((e, i) => (
                <tr key={i}>
                  <td>{i + 1}.</td>
                  <td className="font-handwriting kartu-isi">
                    {e.tanggal ? formatDate(e.tanggal) : ""}
                  </td>
                  <td className="font-handwriting kartu-isi kartu-saran">
                    {e.saran}
                  </td>
                  {/* Paraf sengaja dikosongkan untuk ditandatangani manual */}
                  <td />
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="kartu-identitas">
          <p>
            Nama : {header.nama} &nbsp;·&nbsp; NPM : {header.npm}
          </p>
        </div>
      </div>
    </>
  );
}
