import { cache } from "react";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { getSessionSecret } from "./sessionSecret";

const COOKIE_NAME = "sipro_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  uid: string;
  role: Role;
  name: string;
  nimNip: string;
}

export function signSession(payload: SessionPayload) {
  // getSessionSecret() sengaja dipanggil di sini (bukan saat modul dimuat)
  // supaya kesalahan konfigurasi muncul sebagai error jelas pada saat login,
  // bukan menggagalkan seluruh build.
  return jwt.sign(payload, getSessionSecret(), { expiresIn: "7d" });
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, getSessionSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function setSessionCookie(token: string) {
  const c = await cookies();
  c.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  return verifySession(token);
}

// Dibungkus React cache() agar hanya 1 query per request meskipun dipanggil
// dari layout DAN halaman sekaligus — menghemat query database di tiap navigasi.
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  // `select` ramping untuk jalur panas (dipanggil di layout + tiap halaman).
  // Buang `hashedPassword` (sensitif) DAN relasi mahasiswaProfile/dosenProfile
  // yang nyaris tak pernah dipakai dari sini — memuatnya menambah round-trip DB
  // pada SETIAP navigasi. Halaman yang butuh profil mengambilnya sendiri.
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: {
      id: true,
      email: true,
      nimNip: true,
      name: true,
      role: true,
      prodiId: true,
      isActive: true,
      phone: true,
      address: true,
      createdAt: true,
      updatedAt: true,
      prodi: true,
    },
  });

  // Token berlaku 7 hari dan tidak bisa ditarik kembali dari sisi klien.
  // Karena itu status akun diperiksa di sini: akun yang dihapus atau
  // dinonaktifkan admin langsung kehilangan akses pada permintaan berikutnya,
  // tanpa harus menunggu tokennya kedaluwarsa.
  if (!user || !user.isActive) return null;

  return user;
});

/**
 * Pastikan pemanggil punya sesi sah DAN salah satu role yang diizinkan.
 *
 * Selain mencocokkan role di dalam token, status akun diverifikasi ke database
 * (lewat getCurrentUser yang sudah di-cache per request) sehingga:
 *  - akun nonaktif/terhapus tidak bisa memakai token lamanya, dan
 *  - role yang diturunkan admin langsung berlaku, bukan setelah token habis.
 */
export async function requireRole(...allowed: Role[]) {
  const session = await getSession();
  if (!session || !allowed.includes(session.role)) {
    return null;
  }
  const user = await getCurrentUser();
  if (!user) return null;
  // Role di token sudah tidak sesuai data terbaru → paksa login ulang.
  if (user.role !== session.role || !allowed.includes(user.role)) return null;
  return session;
}

export const SESSION_COOKIE = COOKIE_NAME;
