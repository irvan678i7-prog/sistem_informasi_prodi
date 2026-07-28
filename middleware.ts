import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/edgeJwt";
import { trySessionSecret } from "@/lib/sessionSecret";

const SESSION_COOKIE = "sipro_session";

const PUBLIC_PREFIXES = [
  "/login",
  "/admin/login",
  "/admin/setup",
  "/verify",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/health",
  "/api/setup",
];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname === prefix) return true;
    if (pathname.startsWith(prefix + "/")) return true;
  }
  return false;
}

/**
 * Gerbang autentikasi.
 *
 * Sebelumnya middleware hanya memeriksa apakah cookie `sipro_session` ADA,
 * tanpa memverifikasi isinya — sehingga cookie berisi teks acak pun lolos.
 * Sekarang tanda tangan HMAC dan masa berlaku token diverifikasi memakai Web
 * Crypto (kompatibel Edge Runtime). Cookie yang tidak sah langsung dihapus
 * supaya pengguna tidak terjebak di siklus redirect dengan cookie basi.
 *
 * Catatan: otorisasi per-role tetap dilakukan di server component / server
 * action / route handler (lihat requireRole di lib/auth.ts). Middleware hanya
 * memastikan pemanggil punya sesi yang sah.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = trySessionSecret();
  // secret === null hanya terjadi bila JWT_SECRET salah konfigurasi di
  // production. Dalam kondisi itu kita menolak SEMUA permintaan (fail closed)
  // alih-alih menerima token yang tidak bisa diverifikasi.
  const session = secret ? await verifySessionToken(token, secret) : null;

  if (!session?.uid) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)).*)",
  ],
};
