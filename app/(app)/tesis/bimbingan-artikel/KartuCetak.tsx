import { formatDate } from "@/lib/utils";
import type { BimbinganArtikelRows } from "@/lib/bimbinganArtikel";

// Versi cetak Kartu Bimbingan sesuai format resmi (scan PPs UM Metro):
// judul bergaris titik-titik, tabel No | Tanggal | Saran | Paraf.
// Isian (judul, tanggal, saran) memakai font handwriting; kolom Paraf kosong.
export function KartuCetak({
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
  // Gabungkan catatan P1 & P2 menjadi daftar saran berurutan.
  const entries = rows.flatMap(({ meta, row }) => {
    const list: { tanggal: Date | null; saran: string }[] = [];
    if (row.p1Note)
      list.push({ tanggal: row.p1ReviewedAt, saran: row.p1Note });
    if (row.p2Note)
      list.push({ tanggal: row.p2ReviewedAt, saran: row.p2Note });
    return list.map((e) => ({
      ...e,
      saran: `${meta.label}: ${e.saran}`,
    }));
  });

  const pembimbing = [header.pembimbing1, header.pembimbing2]
    .filter((v) => v && v !== "-")
    .join(", ");

  return (
    <div className="kartu-cetak hidden print:block">
      <h3 className="kartu-judul">
        KARTU BIMBINGAN {track === "ARTIKEL" ? "ARTIKEL" : "TESIS"}
      </h3>

      <ol className="kartu-meta">
        <li>
          <span className="kartu-label">Judul yang di usulkan : </span>
          <span className="font-handwriting kartu-isi">
            {header.judul || "-"}
          </span>
        </li>
        <li>
          <span className="kartu-label">Saran Dosen Pembimbing : </span>
          <span className="font-handwriting kartu-isi">{pembimbing}</span>
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
                Belum ada catatan bimbingan
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
  );
}
