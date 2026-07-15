import { cache } from "react";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

const SECRET = process.env.JWT_SECRET ?? "dev-only-secret-change-me";
const COOKIE_NAME = "sipro_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  uid: string;
  role: Role;
  name: string;
  nimNip: string;
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, SECRET) as SessionPayload;
    return decoded;
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
  return prisma.user.findUnique({
    where: { id: session.uid },
    include: {
      prodi: true,
      mahasiswaProfile: true,
      dosenProfile: true,
    },
  });
});

export async function requireRole(...allowed: Role[]) {
  const session = await getSession();
  if (!session || !allowed.includes(session.role)) {
    return null;
  }
  return session;
}

export const SESSION_COOKIE = COOKIE_NAME;
