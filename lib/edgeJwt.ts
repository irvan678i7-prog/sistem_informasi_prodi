// Verifikasi JWT HS256 memakai Web Crypto — aman dijalankan di Edge Runtime.
//
// Middleware Next.js berjalan di Edge Runtime, sehingga paket `jsonwebtoken`
// (yang bergantung pada modul Node: crypto/buffer/stream) tidak bisa dipakai
// di sana. Karena itu middleware dulu hanya memeriksa KEBERADAAN cookie sesi —
// artinya cookie berisi teks acak pun bisa melewati gerbang middleware.
//
// Fungsi di bawah memverifikasi tanda tangan HMAC-SHA256 dan masa berlaku
// (`exp`) token tanpa dependensi tambahan.

export type EdgeSessionPayload = {
  uid?: string;
  role?: string;
  name?: string;
  nimNip?: string;
  iat?: number;
  exp?: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Decode segmen base64url menjadi ArrayBuffer.
 *
 * Sengaja mengembalikan `ArrayBuffer` (bukan `Uint8Array`) karena sejak
 * TypeScript 5.7 `Uint8Array` bergeneric atas `ArrayBufferLike`, sehingga tidak
 * bisa langsung dipakai sebagai `BufferSource` pada crypto.subtle.
 */
function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + padding);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

function decodeJsonSegment(segment: string): unknown {
  return JSON.parse(decoder.decode(base64UrlToArrayBuffer(segment)));
}

/**
 * Verifikasi token JWT HS256.
 *
 * @returns payload token bila tanda tangan sah dan belum kedaluwarsa,
 *          `null` untuk semua kondisi lain (format salah, algoritma bukan
 *          HS256, tanda tangan tidak cocok, atau sudah kedaluwarsa).
 */
export async function verifySessionToken(
  token: string | undefined | null,
  secret: string,
): Promise<EdgeSessionPayload | null> {
  if (!token || !secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerSegment, payloadSegment, signatureSegment] = parts;

  try {
    const header = decodeJsonSegment(headerSegment) as { alg?: string } | null;
    // Tolak alg lain — khususnya "none" — agar tidak bisa dilewati.
    if (!header || header.alg !== "HS256") return null;

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToArrayBuffer(signatureSegment),
      encoder.encode(`${headerSegment}.${payloadSegment}`),
    );
    if (!isValid) return null;

    const payload = decodeJsonSegment(payloadSegment) as EdgeSessionPayload | null;
    if (!payload || typeof payload !== "object") return null;
    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
