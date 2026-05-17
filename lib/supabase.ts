import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function getSupabaseAdmin() {
  if (!url || !serviceKey) {
    throw new Error("Supabase env not configured");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const STORAGE_BUCKET = "documents";

export async function ensureBucket() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.storage.getBucket(STORAGE_BUCKET);
  if (!data) {
    await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 20 * 1024 * 1024,
    });
  }
}
