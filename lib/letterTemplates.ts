import type { LetterType } from "@prisma/client";

export const LETTER_LABEL: Record<LetterType, string> = {
  AKTIF_KULIAH: "Surat Keterangan Aktif Kuliah",
  IZIN_PENELITIAN: "Surat Izin Penelitian",
  CUTI_AKADEMIK: "Surat Cuti Akademik",
  PENGANTAR_SKPI: "Surat Pengantar SKPI",
  BEBAS_PLAGIASI: "Surat Keterangan Bebas Plagiasi",
};

export const LETTER_DESC: Record<LetterType, string> = {
  AKTIF_KULIAH:
    "Surat keterangan bahwa mahasiswa terdaftar aktif pada semester berjalan.",
  IZIN_PENELITIAN:
    "Surat permohonan izin pengumpulan data penelitian tesis.",
  CUTI_AKADEMIK:
    "Surat pengajuan cuti akademik (berhenti studi sementara) 1 semester.",
  PENGANTAR_SKPI:
    "Surat pengantar penerbitan Surat Keterangan Pendamping Ijazah.",
  BEBAS_PLAGIASI:
    "Surat keterangan bahwa naskah tesis telah lolos uji plagiasi.",
};

export interface LetterField {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "number";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
}

export const LETTER_FIELDS: Record<LetterType, LetterField[]> = {
  AKTIF_KULIAH: [
    { name: "keperluan", label: "Keperluan", type: "textarea", required: true,
      placeholder: "Mis. Mengurus tunjangan kuliah anak di kantor orang tua." },
    { name: "ditujukan", label: "Surat Ditujukan Kepada", type: "text", required: true,
      placeholder: "Mis. Kantor Yth. Kepala Dinas Pendidikan ..." },
    { name: "tahunAkademik", label: "Tahun Akademik", type: "text", required: true,
      placeholder: "Mis. 2024/2025" },
    { name: "semester", label: "Semester", type: "select", required: true,
      options: [
        { value: "Ganjil", label: "Ganjil" },
        { value: "Genap", label: "Genap" },
      ] },
  ],
  IZIN_PENELITIAN: [
    { name: "judulPenelitian", label: "Judul Penelitian", type: "textarea", required: true },
    { name: "tempatPenelitian", label: "Tempat / Lokasi Penelitian", type: "textarea", required: true },
    { name: "tanggalMulai", label: "Tanggal Mulai", type: "date", required: true },
    { name: "tanggalSelesai", label: "Tanggal Selesai", type: "date", required: true },
    { name: "ditujukan", label: "Surat Ditujukan Kepada", type: "text", required: true,
      placeholder: "Mis. Yth. Kepala Sekolah/Pimpinan Instansi ..." },
  ],
  CUTI_AKADEMIK: [
    { name: "tahunAkademik", label: "Tahun Akademik Cuti", type: "text", required: true,
      placeholder: "Mis. 2024/2025" },
    { name: "semester", label: "Semester", type: "select", required: true,
      options: [
        { value: "Ganjil", label: "Ganjil" },
        { value: "Genap", label: "Genap" },
      ] },
    { name: "alasan", label: "Alasan", type: "textarea", required: true,
      placeholder: "Jelaskan alasan pengajuan cuti." },
  ],
  PENGANTAR_SKPI: [
    { name: "noIjazah", label: "Nomor Ijazah", type: "text" },
    { name: "tanggalLulus", label: "Tanggal Lulus", type: "date", required: true },
    { name: "kompetensi", label: "Kompetensi/Kegiatan Pendukung", type: "textarea", required: true,
      hint: "Isi dengan kompetensi tambahan, sertifikat, atau kegiatan yang ingin dicantumkan di SKPI." },
  ],
  BEBAS_PLAGIASI: [
    { name: "judulTesis", label: "Judul Tesis", type: "textarea", required: true },
    { name: "persenSimilarity", label: "Persentase Similarity (%)", type: "number", required: true },
    { name: "alatUji", label: "Alat Uji Plagiasi", type: "text", required: true,
      placeholder: "Mis. Turnitin / UPI UM Metro" },
    { name: "tanggalUji", label: "Tanggal Uji", type: "date", required: true },
  ],
};
