import { getSupabaseAdmin, STORAGE_BUCKET, ensureBucket } from "./supabase";

/** Batas maksimal ukuran file upload mahasiswa (2 MB). */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "2MB";

/**
 * Upload a raw buffer to Supabase Storage and return its public URL.
 * Bucket is auto-created on first use (see ensureBucket()).
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
 * Useful if you later flip the bucket to private for sensitive documents.
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
 * Best-effort: hapus objek Storage berdasarkan public URL-nya. Dipakai saat
 * memangkas riwayat berkas (mis. setelah kedua pembimbing meng-ACC bagian,
 * hanya 1 berkas final yang disimpan). Path storage diambil dari bagian
 * setelah "/object/public/<bucket>/" pada URL publik Supabase. Aman dipanggil
 * dengan URL yang formatnya tak dikenal — URL seperti itu dilewati.
 */
export async function deletePublicUrls(urls: string[]): Promise<void> {
  const clean = urls.filter((u) => typeof u === "string" && u.length > 0);
  if (clean.length === 0) return;
  const supabase = getSupabaseAdmin();
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const paths = clean
    .map((u) => {
      const i = u.indexOf(marker);
      if (i < 0) return null;
      const raw = u.slice(i + marker.length).split("?")[0];
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    })
    .filter((p): p is string => !!p);
  if (paths.length === 0) return;
  await supabase.storage.from(STORAGE_BUCKET).remove(paths);
}
