import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 storage adapter.
 *
 * R2 is S3-compatible; we use the AWS SDK pointed at the R2 endpoint.
 * Required env (see SETUP.md):
 *   - R2_ACCOUNT_ID         (Cloudflare account id)
 *   - R2_ACCESS_KEY_ID      (R2 API token access key)
 *   - R2_SECRET_ACCESS_KEY  (R2 API token secret)
 *   - R2_BUCKET_NAME        (e.g. "sipro-documents")
 *   - R2_PUBLIC_BASE_URL    (public r2.dev URL OR custom domain), without trailing slash
 */

const accountId = process.env.R2_ACCOUNT_ID ?? "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
const bucket = process.env.R2_BUCKET_NAME ?? "";
const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");

let _client: S3Client | null = null;
let _bucketChecked = false;

function getClient(): S3Client {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "Cloudflare R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
        "R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME (and optionally R2_PUBLIC_BASE_URL) " +
        "in your .env. See SETUP.md.",
    );
  }
  if (_client) return _client;
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

/**
 * Verify the bucket exists and credentials work. Cached per process.
 * Throws a clear error message if misconfigured.
 */
export async function ensureBucket(): Promise<void> {
  if (_bucketChecked) return;
  const client = getClient();
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    _bucketChecked = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Cannot access R2 bucket "${bucket}": ${msg}. ` +
        `Verify the bucket exists in your Cloudflare R2 dashboard and ` +
        `the API token has Object Read & Write permissions for it.`,
    );
  }
}

function buildPublicUrl(key: string): string {
  if (!publicBaseUrl) {
    throw new Error(
      "R2_PUBLIC_BASE_URL is not set. Enable the bucket's public access " +
        "(Settings -> Public Access -> r2.dev) or attach a custom domain, " +
        "then put the URL into R2_PUBLIC_BASE_URL.",
    );
  }
  return `${publicBaseUrl}/${encodeURI(key)}`;
}

/**
 * Upload a raw buffer/array to R2 and return its public URL.
 * The bucket must already exist (created once via Cloudflare dashboard).
 */
export async function uploadBuffer(
  key: string,
  buffer: Buffer | Uint8Array | ArrayBuffer,
  contentType: string,
): Promise<{ url: string; path: string }> {
  await ensureBucket();
  const body =
    buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : buffer instanceof Uint8Array
        ? buffer
        : new Uint8Array(buffer);

  try {
    await getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`R2 upload failed for "${key}" (bucket="${bucket}"): ${msg}`);
  }

  return { url: buildPublicUrl(key), path: key };
}

/**
 * Upload a browser File (multipart) to R2.
 */
export async function uploadFile(
  key: string,
  file: File,
): Promise<{ url: string; path: string; size: number; mimeType: string }> {
  const ab = await file.arrayBuffer();
  const mime = file.type || "application/octet-stream";
  const res = await uploadBuffer(key, new Uint8Array(ab), mime);
  return { ...res, size: file.size, mimeType: mime };
}

/**
 * Generate a short-lived signed GET URL. Useful when bucket is kept private.
 */
export async function getSignedUrl(
  key: string,
  expiresInSeconds = 60 * 10,
): Promise<string> {
  const client = getClient();
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getS3SignedUrl(client, cmd, { expiresIn: expiresInSeconds });
}

