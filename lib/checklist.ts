// Konfigurasi terpusat untuk dua checklist berkas: Seminar Proposal (10 item)
// dan Ujian Tesis/KUT (14 item). Dipakai bersama oleh halaman upload mahasiswa,
// halaman ceklis TU, endpoint API, dokumen cetak, dan dashboard — supaya kedua
// alur konsisten tanpa duplikasi teks/logika.

import { SEMINAR_BERKAS_ITEMS } from "./seminarBerkas";
import { KUT_CHECKLIST_ITEMS } from "./kutChecklist";

export type ChecklistJenis = "seminar" | "ujian";

export interface ChecklistConfig {
  jenis: ChecklistJenis;
  items: string[];
  /** Judul resmi pada dokumen cetak. */
  docTitle: string;
  /** Judul ringkas untuk UI. */
  shortTitle: string;
  /** Endpoint upload berkas per item (mahasiswa). */
  uploadEndpoint: string;
  /** Endpoint simpan ceklis ADA/TIDAK (TU). */
  tuChecklistEndpoint: string;
  /** Halaman daftar mahasiswa untuk TU. */
  tuListHref: string;
  /** Halaman upload berkas (mahasiswa). */
  mahasiswaHref: string;
}

export const CHECKLIST_CONFIG: Record<ChecklistJenis, ChecklistConfig> = {
  seminar: {
    jenis: "seminar",
    items: SEMINAR_BERKAS_ITEMS,
    docTitle: "Check List Berkas Syarat untuk Mendaftar Seminar Proposal Tesis",
    shortTitle: "Berkas Seminar Proposal",
    uploadEndpoint: "/api/tesis/seminar-proposal/upload",
    tuChecklistEndpoint: "/api/tu/seminar-checklist",
    tuListHref: "/tu/seminar-berkas",
    mahasiswaHref: "/tesis/seminar-proposal",
  },
  ujian: {
    jenis: "ujian",
    items: KUT_CHECKLIST_ITEMS,
    docTitle: "Check List Berkas Syarat untuk Mendaftar Ujian Tesis",
    shortTitle: "Berkas Ujian Tesis",
    uploadEndpoint: "/api/tesis/ujian-berkas/upload",
    tuChecklistEndpoint: "/api/tu/ujian-checklist",
    tuListHref: "/tu/ujian-berkas",
    mahasiswaHref: "/tesis/ujian-berkas",
  },
};

export function isChecklistJenis(v: unknown): v is ChecklistJenis {
  return v === "seminar" || v === "ujian";
}

/** Normalisasi nilai JSON dari DB menjadi array boolean sepanjang jumlah item. */
export function parseChecklist(
  value: unknown,
  jenis: ChecklistJenis,
): boolean[] {
  const arr = Array.isArray(value) ? value : [];
  return CHECKLIST_CONFIG[jenis].items.map((_, i) => arr[i] === true);
}

export interface ChecklistApprovalEntry {
  code: string;
  approvedAt: string; // ISO string
  signerName: string;
  signerRole: string;
}

export type ChecklistApproval = Partial<
  Record<ChecklistJenis, ChecklistApprovalEntry>
>;

/** Baca metadata pengesahan (Tesis.checklistApproval) dengan aman. */
export function parseChecklistApproval(value: unknown): ChecklistApproval {
  if (!value || typeof value !== "object") return {};
  const src = value as Record<string, unknown>;
  const out: ChecklistApproval = {};
  (["seminar", "ujian"] as ChecklistJenis[]).forEach((jenis) => {
    const entry = src[jenis];
    if (entry && typeof entry === "object") {
      const o = entry as Record<string, unknown>;
      if (typeof o.code === "string" && o.code) {
        out[jenis] = {
          code: o.code,
          approvedAt: typeof o.approvedAt === "string" ? o.approvedAt : "",
          signerName: typeof o.signerName === "string" ? o.signerName : "",
          signerRole: typeof o.signerRole === "string" ? o.signerRole : "",
        };
      }
    }
  });
  return out;
}
