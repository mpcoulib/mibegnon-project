import { COACHING_STORAGE_BUCKET } from "@/lib/coaching/constants";
import { createAdminClient } from "@/lib/supabase/admin";

let bucketReady = false;

async function client() {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error(
      "Stockage indisponible : SUPABASE_SERVICE_ROLE_KEY manquante.",
    );
  }
  return supabase;
}

async function ensureBucket() {
  if (bucketReady) return;
  const supabase = await client();
  const { data } = await supabase.storage.getBucket(COACHING_STORAGE_BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(COACHING_STORAGE_BUCKET, {
      public: false,
      fileSizeLimit: "8MB",
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ],
    });
    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`Bucket coaching : ${error.message}`);
    }
  }
  bucketReady = true;
}

export async function uploadPrivateFile(
  path: string,
  bytes: Buffer,
  mimeType: string,
): Promise<string> {
  const supabase = await client();
  await ensureBucket();
  const { error } = await supabase.storage
    .from(COACHING_STORAGE_BUCKET)
    .upload(path, bytes, { contentType: mimeType, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function signedFileUrl(
  path: string,
  expiresSec = 3600,
): Promise<string | null> {
  const supabase = await client();
  const { data, error } = await supabase.storage
    .from(COACHING_STORAGE_BUCKET)
    .createSignedUrl(path, expiresSec);
  if (error) return null;
  return data.signedUrl;
}
