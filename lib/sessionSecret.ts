// Sumber tunggal untuk rahasia penanda tangan sesi (JWT).
//
// Modul ini SENGAJA tidak mengimpor apa pun (tanpa Prisma, tanpa next/headers)
// supaya bisa dipakai dari Node runtime (lib/auth.ts) MAUPUN Edge runtime
// (middleware.ts).
//
// Sebelumnya lib/auth.ts memakai fallback hardcoded:
//     process.env.JWT_SECRET ?? "dev-only-secret-change-me"
// Kalau JWT_SECRET lupa diisi di production, aplikasi tetap jalan tetapi siapa
// pun yang tahu string tersebut bisa membuat token sendiri — termasuk token
// dengan role ADMIN. Karena itu di production sekarang kita gagal keras
// (fail fast) daripada berjalan dengan sesi yang bisa dipalsukan.

/** Panjang minimal yang wajar untuk rahasia HMAC-SHA256. */
export const MIN_SECRET_LENGTH = 32;

/** Hanya untuk pengembangan lokal — TIDAK pernah dipakai di production. */
const DEV_FALLBACK_SECRET = "dev-only-secret-change-me";

let warned = false;

function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`[auth] ${message}`);
}

/**
 * Ambil rahasia sesi.
 *
 * - Production: WAJIB ada `JWT_SECRET` minimal 32 karakter, kalau tidak throw.
 * - Development: boleh kosong / pendek, dengan peringatan di konsol.
 */
export function getSessionSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (secret && secret.length >= MIN_SECRET_LENGTH) return secret;

  if (isProduction) {
    throw new Error(
      `JWT_SECRET belum diset atau terlalu pendek (minimal ${MIN_SECRET_LENGTH} karakter). ` +
        "Isi environment variable JWT_SECRET di Vercel (buat dengan: openssl rand -base64 48) " +
        "lalu redeploy. Aplikasi menolak berjalan dengan rahasia sesi bawaan karena token " +
        "sesi akan bisa dipalsukan.",
    );
  }

  if (secret) {
    warnOnce(
      `JWT_SECRET lebih pendek dari ${MIN_SECRET_LENGTH} karakter. Cukup untuk pengembangan lokal, TIDAK boleh dipakai di production.`,
    );
    return secret;
  }

  warnOnce(
    "JWT_SECRET tidak diset. Memakai rahasia pengembangan bawaan — jangan pernah dipakai di production.",
  );
  return DEV_FALLBACK_SECRET;
}

/**
 * Versi aman-gagal untuk middleware: mengembalikan `null` (bukan throw) kalau
 * konfigurasi belum benar, sehingga middleware bisa menolak semua permintaan
 * ke halaman terproteksi alih-alih menampilkan layar error.
 */
export function trySessionSecret(): string | null {
  try {
    return getSessionSecret();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return null;
  }
}
