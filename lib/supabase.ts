import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET?.trim() || "documents";

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
 * Idempotently ensure the storage bucket exists.
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
        public: true,
        fileSizeLimit: 20 * 1024 * 1024, // 20 MB
      },
    );
    if (createErr) {
      throw new Error(
        `Failed to create Supabase bucket "${STORAGE_BUCKET}": ${createErr.message}`,
      );
    }
  }
  _bucketReady = true;
}
