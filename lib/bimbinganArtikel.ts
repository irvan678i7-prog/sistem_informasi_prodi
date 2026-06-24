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

// Load all eight sections for a tesis, creating any missing rows so the
// worksheet is always complete. Returns rows ordered 1..8.
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

  // Return in canonical 1..8 order.
  return BIMBINGAN_SECTIONS.map((meta) => ({
    meta,
    row: bySection.get(meta.section)!,
  }));
}

export type BimbinganArtikelRows = Awaited<
  ReturnType<typeof getBimbinganArtikel>
>;
