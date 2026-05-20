import type { Role } from "@prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  KAPRODI: "Ketua Program Studi",
  DOSEN: "Dosen",
  MAHASISWA: "Mahasiswa",
};

// Administrator: kelola akun, data master, audit log. TIDAK ikut alur akademik.
export function canManageUsers(role: Role) {
  return role === "ADMIN";
}

export function canManageProdi(role: Role) {
  return role === "ADMIN";
}

// Dosen mencakup dosen biasa + kaprodi (yang juga tetap dosen).
export function isDosen(role: Role) {
  return role === "DOSEN" || role === "KAPRODI";
}

export function isStaff(role: Role) {
  return role !== "MAHASISWA";
}

// Verifikasi awal: dosen PA / dosen pembimbing / kaprodi.
export function canHandleLetter(role: Role) {
  return role === "DOSEN" || role === "KAPRODI";
}

// Persetujuan akhir & tanda tangan: kaprodi.
export function canApproveLetter(role: Role) {
  return role === "KAPRODI";
}

// Apakah role tertentu ikut alur akademik (verifikasi/persetujuan)?
export function isAcademicHandler(role: Role) {
  return isDosen(role);
}

// Mapping ke jabatan yang muncul di blok tanda tangan dokumen.
export const ROLE_TITLE: Partial<Record<Role, string>> = {
  KAPRODI: "Ketua Program Studi",
  ADMIN: "Administrator",
  DOSEN: "Dosen",
};

