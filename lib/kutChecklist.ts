/**
 * Daftar 14 berkas syarat untuk mendaftar Ujian Tesis,
 * sesuai format resmi "CHECK LIST BERKAS SYARAT UNTUK MENDAFTAR UJIAN TESIS"
 * Program Pascasarjana UM Metro.
 */
export const KUT_CHECKLIST_ITEMS: string[] = [
  "Form asli Kelayakan Ujian Tesis yang telah ditandatangani oleh Dosen Pembimbing, Ketua Program Studi, dan Direktur",
  "Telah lulus mata kuliah wajib minimal 38 sks (dibuktikan dengan transkrip sementara)",
  "Fotokopi kwitansi pembayaran SMTR 4 (semester berjalan)",
  "Fotokopi tesis yang telah ditandatangani pada lembar persetujuan sebanyak 4 rangkap",
  "Cetak handout powerpoint bahan presentasi ujian",
  "Fotokopi kartu bimbingan tesis",
  "Berita acara, instrumen penilaian, dan lembar saran ujian",
  "Form jadwal persetujuan ujian",
  "Bukti submit artikel ke jurnal",
  "Bukti uji similaritas (plagiasi) artikel",
  "Bukti uji similaritas (plagiasi) tesis",
  "SK Ujian Tesis",
  "Semua persyaratan dimasukkan ke dalam Map Snail",
  "Berkas dikembalikan ke TU setelah pelaksanaan sidang",
];

export type KutChecklist = boolean[];

/** Normalisasi nilai JSON dari database menjadi array boolean 14 item. */
export function parseKutChecklist(value: unknown): KutChecklist {
  const arr = Array.isArray(value) ? value : [];
  return KUT_CHECKLIST_ITEMS.map((_, i) => arr[i] === true);
}
