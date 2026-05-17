import { getSupabaseAdmin, STORAGE_BUCKET, ensureBucket } from "./supabase";

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
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function uploadFileToSupabase(
  path: string,
  file: File,
): Promise<{ url: string; path: string; size: number; mimeType: string }> {
  const arr = new Uint8Array(await file.arrayBuffer());
  const res = await uploadBufferToSupabase(path, arr, file.type || "application/octet-stream");
  return { ...res, size: file.size, mimeType: file.type || "application/octet-stream" };
}
