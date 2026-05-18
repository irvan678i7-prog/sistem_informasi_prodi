import { getSupabaseAdmin, STORAGE_BUCKET, ensureBucket } from "./supabase";

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
