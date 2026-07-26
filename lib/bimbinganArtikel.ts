// Bimbingan artikel/tesis — section metadata + helpers.
//
// The lembar bimbingan evaluates eight fixed sections (1..8) of the article.
// This module is the single source of truth for the section order and their
// human labels, and for ensuring every tesis has a row per section so the
// worksheet always renders entries 1 through 8.

import type { BimbinganSection, RevisiSeverity } from "@prisma/client";
import { prisma } from "./prisma";

export const BIMBINGAN_SECTIONS: {
  section: BimbinganSection;
  no: number;
  label: string;
}[] = [
  { section: "JUDUL", no: 1, label: "Judul" },
  { section: "PENDAHULUAN", no: 2, label: "Pendahuluan (Bab I)" },
  { section: "KAJIAN_PUSTAKA", no: 3, label: "Bab II — Kajian Pustaka" },
  { section: "METODOLOGI", no: 4, label: "Bab III — Metodologi" },
  { section: "INSTRUMEN", no: 5, label: "Instrumen, dll" },
  { section: "HASIL", no: 6, label: "Bab IV — Hasil" },
  { section: "KESIMPULAN", no: 7, label: "Bab V — Kesimpulan" },
  { section: "REFERENSI", no: 8, label: "Referensi" },
];

export const SEVERITY_OPTIONS: { value: RevisiSeverity; label: string }[] = [
  { value: "BAIK", label: "Baik" },
  { value: "REVISI_RINGAN", label: "Revisi Ringan" },
  { value: "REVISI_SEDANG", label: "Revisi Sedang" },
  { value: "REVISI_BERAT", label: "Revisi Berat" },
];

export function sectionLabel(section: BimbinganSection): string {
  return (
    BIMBINGAN_SECTIONS.find((s) => s.section === section)?.label ?? section
  );
}

export type ArtikelCommentRow = {
  id: string;
  section: BimbinganSection;
  peran: string;
  dosenName: string;
  severity: RevisiSeverity | null;
  note: string | null;
  approved: boolean;
  createdAt: Date;
};

// Load all eight sections for a tesis, creating any missing rows so the
// worksheet is always complete. Returns rows ordered 1..8, each with its
// full upload (revision) history.
export async function getBimbinganArtikel(tesisId: string) {
  const existing = await prisma.bimbinganArtikel.findMany({
    where: { tesisId },
  });
  const bySection = new Map(existing.map((r) => [r.section, r]));

  const missing = BIMBINGAN_SECTIONS.filter(
    (s) => !bySection.has(s.section),
  ).map((s) => ({ tesisId, section: s.section }));

  if (missing.length) {
    await prisma.bimbinganArtikel.createMany({
      data: missing,
      skipDuplicates: true,
    });
    const refreshed = await prisma.bimbinganArtikel.findMany({
      where: { tesisId },
    });
    refreshed.forEach((r) => bySection.set(r.section, r));
  }

  // Riwayat semua unggahan (revisi) per bagian, terbaru lebih dulu. Setiap
  // unggahan tersimpan di BimbinganArtikelFile sehingga versi lama tetap
  // dapat dibuka oleh dosen maupun mahasiswa.
  const files = await prisma.bimbinganArtikelFile.findMany({
    where: { tesisId },
    orderBy: [{ revision: "desc" }, { createdAt: "desc" }],
  });
  const historyBySection = new Map<BimbinganSection, typeof files>();
  for (const f of files) {
    const list = historyBySection.get(f.section);
    if (list) list.push(f);
    else historyBySection.set(f.section, [f]);
  }

  // Riwayat komentar/penilaian pembimbing (TIDAK dipangkas walau sudah ACC).
  // Di-guard try/catch supaya halaman tetap terbuka jika tabel baru belum
  // di-migrasi di database.
  let comments: ArtikelCommentRow[] = [];
  try {
    comments = await prisma.bimbinganArtikelComment.findMany({
      where: { tesisId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        section: true,
        peran: true,
        dosenName: true,
        severity: true,
        note: true,
        approved: true,
        createdAt: true,
      },
    });
  } catch (e) {
    console.error("[bimbinganArtikel] tabel komentar belum tersedia:", e);
  }
  const commentsBySection = new Map<
    BimbinganSection,
    { p1: ArtikelCommentRow[]; p2: ArtikelCommentRow[] }
  >();
  for (const meta of BIMBINGAN_SECTIONS)
    commentsBySection.set(meta.section, { p1: [], p2: [] });
  for (const c of comments) {
    const bucket = commentsBySection.get(c.section);
    if (!bucket) continue;
    (c.peran === "P2" ? bucket.p2 : bucket.p1).push(c);
  }

  // Return in canonical 1..8 order.
  return BIMBINGAN_SECTIONS.map((meta) => ({
    meta,
    row: bySection.get(meta.section)!,
    history: historyBySection.get(meta.section) ?? [],
    comments: commentsBySection.get(meta.section) ?? { p1: [], p2: [] },
  }));
}

export type BimbinganArtikelRows = Awaited<
  ReturnType<typeof getBimbinganArtikel>
>;
