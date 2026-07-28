import {
  getSupabaseAdmin,
  STORAGE_BUCKET,
  STORAGE_PRIVATE,
  ensureBucket,
} from "./supabase";

/** Batas maksimal ukuran file upload mahasiswa (2 MB). */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "2MB";

/** Prefiks rute aplikasi yang menyajikan berkas privat setelah cek sesi. */
export const FILE_ROUTE_PREFIX = "/api/berkas";

/** Penanda pada URL publik Supabase: .../storage/v1/object/public/<bucket>/ */
const PUBLIC_URL_MARKER = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

/** URL aplikasi (terautentikasi) untuk sebuah path di Storage. */
export function fileRouteUrl(path: string): string {
  const encoded = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${FILE_ROUTE_PREFIX}/${encoded}`;
}

/**
 * Ambil path Storage dari sebuah URL publik Supabase.
 * Mengembalikan `null` bila format URL tidak dikenali.
 */
export function storagePathFromPublicUrl(rawUrl: string): string | null {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) return null;
  const index = rawUrl.indexOf(PUBLIC_URL_MARKER);
  if (index < 0) return null;
  const raw = rawUrl.slice(index + PUBLIC_URL_MARKER.length).split("?")[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Ubah URL berkas yang tersimpan di database menjadi tautan yang aman dipakai
 * di UI. Pada mode privat, URL publik lama dialihkan ke rute terautentikasi
 * `/api/berkas/...`; URL yang sudah memakai rute itu (atau format lain)
 * dibiarkan apa adanya.
 */
export function fileHref(rawUrl: string): string {
  if (!STORAGE_PRIVATE) return rawUrl;
  if (rawUrl.startsWith(FILE_ROUTE_PREFIX)) return rawUrl;
  const path = storagePathFromPublicUrl(rawUrl);
  return path ? fileRouteUrl(path) : rawUrl;
}

/**
 * Upload a raw buffer to Supabase Storage and return its URL.
 * Bucket is auto-created on first use (see ensureBucket()).
 *
 * Pada mode privat, URL yang dikembalikan adalah rute aplikasi
 * `/api/berkas/<path>` — bukan URL publik Supabase.
 */
export async function uploadBufferToSupabase(
  path: string,
  buffer: Buffer | Uint8Array | ArrayBuffer,
  contentType: string,
): Promise<{ url: string; path: string }> {
  await ensureBucket();
  const supabase = getSupabaseAdmin();
  const body = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, body, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(
      `Supabase upload failed for "${path}" (bucket="${STORAGE_BUCKET}"): ${error.message}`,
    );
  }

  if (STORAGE_PRIVATE) {
    return { url: fileRouteUrl(path), path };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function uploadFileToSupabase(
  path: string,
  file: File,
): Promise<{ url: string; path: string; size: number; mimeType: string }> {
  const arr = new Uint8Array(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";
  const res = await uploadBufferToSupabase(path, arr, mime);
  return { ...res, size: file.size, mimeType: mime };
}

/**
 * Generate a short-lived signed URL for a private object.
 * Dipakai oleh rute `/api/berkas/[...path]` setelah sesi diverifikasi.
 */
export async function getSignedUrl(
  path: string,
  expiresInSeconds = 60 * 10,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) {
    throw new Error(
      `Failed to create signed URL for "${path}": ${error?.message ?? "unknown error"}`,
    );
  }
  return data.signedUrl;
}

/**
 * Best-effort: hapus objek Storage berdasarkan URL yang tersimpan di database.
 * Dipakai saat memangkas riwayat berkas (mis. setelah kedua pembimbing meng-ACC
 * bagian, hanya 1 berkas final yang disimpan). Mendukung URL publik Supabase
 * maupun URL rute aplikasi `/api/berkas/...`. URL dengan format tak dikenal
 * dilewati.
 */
export async function deletePublicUrls(urls: string[]): Promise<void> {
  const clean = urls.filter((u) => typeof u === "string" && u.length > 0);
  if (clean.length === 0) return;
  const supabase = getSupabaseAdmin();
  const paths = clean
    .map((u) => {
      if (u.startsWith(`${FILE_ROUTE_PREFIX}/`)) {
        const raw = u.slice(FILE_ROUTE_PREFIX.length + 1).split("?")[0];
        try {
          return decodeURIComponent(raw);
        } catch {
          return raw;
        }
      }
      return storagePathFromPublicUrl(u);
    })
    .filter((p): p is string => !!p);
  if (paths.length === 0) return;
  await supabase.storage.from(STORAGE_BUCKET).remove(paths);
}
