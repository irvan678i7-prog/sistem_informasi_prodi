import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET?.trim() || "documents";

/**
 * Mode privat untuk Storage.
 *
 * Bucket `documents` menyimpan berkas sensitif: draft tesis, surat, SK,
 * berkas persyaratan mahasiswa. Selama bucket bersifat publik, siapa pun yang
 * memiliki (atau menebak) URL-nya bisa mengunduh berkas tanpa login.
 *
 * Bila `SUPABASE_STORAGE_PRIVATE="true"`:
 *  - bucket dibuat / diubah menjadi non-publik, dan
 *  - hasil upload mengembalikan URL aplikasi `/api/berkas/<path>` yang
 *    memeriksa sesi lalu meneruskan ke signed URL berumur pendek.
 *
 * Default masih `false` karena URL publik lama sudah tersimpan di database dan
 * pratinjau dokumen Word memakai Office Online (butuh URL yang dapat diakses
 * dari luar). Lihat catatan migrasi di .env.example.
 */
export const STORAGE_PRIVATE = process.env.SUPABASE_STORAGE_PRIVATE === "true";

let _client: SupabaseClient | null = null;
let _bucketReady = false;

export function getSupabaseAdmin(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase env not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env. " +
        "See SETUP.md for instructions.",
    );
  }
  if (_client) return _client;
  _client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

/**
 * Idempotently ensure the storage bucket exists (dan sesuai mode privat).
 * Cached per-process so we only call Supabase once per cold start.
 */
export async function ensureBucket(): Promise<void> {
  if (_bucketReady) return;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.getBucket(STORAGE_BUCKET);
  if (error && !/not.?found/i.test(error.message)) {
    // If we can't even read bucket info, surface the error early
    throw new Error(
      `Failed to read Supabase bucket "${STORAGE_BUCKET}": ${error.message}`,
    );
  }
  if (!data) {
    const { error: createErr } = await supabase.storage.createBucket(
      STORAGE_BUCKET,
      {
        public: !STORAGE_PRIVATE,
        fileSizeLimit: 20 * 1024 * 1024, // 20 MB
      },
    );
    if (createErr) {
      throw new Error(
        `Failed to create Supabase bucket "${STORAGE_BUCKET}": ${createErr.message}`,
      );
    }
  } else if (STORAGE_PRIVATE && data.public) {
    // Bucket lama masih publik → tutup aksesnya.
    const { error: updateErr } = await supabase.storage.updateBucket(
      STORAGE_BUCKET,
      { public: false },
    );
    if (updateErr) {
      throw new Error(
        `Failed to make Supabase bucket "${STORAGE_BUCKET}" private: ${updateErr.message}`,
      );
    }
  }
  _bucketReady = true;
}
