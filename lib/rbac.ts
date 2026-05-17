import type { Role } from "@prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN_SISTEM: "Admin Sistem",
  ADMIN_PRODI: "Admin Prodi",
  KAPRODI: "Kaprodi",
  WAKIL_DIREKTUR: "Wakil Direktur",
  DIREKTUR: "Direktur",
  DOSEN: "Dosen",
  MAHASISWA: "Mahasiswa",
};

// Admin sistem hanya mengelola akun & data master. TIDAK ikut alur verifikasi.
export function canManageUsers(role: Role) {
  return role === "ADMIN_SISTEM";
}

export function canManageProdi(role: Role) {
  return role === "ADMIN_SISTEM";
}

export function isDosen(role: Role) {
  return (
    role === "DOSEN" ||
    role === "KAPRODI" ||
    role === "WAKIL_DIREKTUR" ||
    role === "DIREKTUR"
  );
}

export function isStaff(role: Role) {
  return role !== "MAHASISWA";
}

// Verifikasi awal: dosen PA / dosen pembimbing / kaprodi.
export function canHandleLetter(role: Role) {
  return (
    role === "DOSEN" ||
    role === "KAPRODI" ||
    role === "WAKIL_DIREKTUR" ||
    role === "DIREKTUR"
  );
}

// Persetujuan akhir & tanda tangan: kaprodi ke atas.
export function canApproveLetter(role: Role) {
  return (
    role === "KAPRODI" ||
    role === "WAKIL_DIREKTUR" ||
    role === "DIREKTUR"
  );
}

// Apakah role tertentu ikut alur akademik (verifikasi/persetujuan)?
export function isAcademicHandler(role: Role) {
  return isDosen(role);
}
