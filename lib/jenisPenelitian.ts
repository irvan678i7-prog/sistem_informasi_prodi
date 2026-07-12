/** Pilihan jenis penelitian pada Formulir Pengajuan Judul (format resmi). */
export const JENIS_PENELITIAN = [
  "Kuantitatif",
  "Kualitatif",
  "Pengembangan",
  "Studi literatur",
] as const;

export type JenisPenelitian = (typeof JENIS_PENELITIAN)[number];
