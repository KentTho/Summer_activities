/**
 * Lưu ảnh gốc AI import trong bucket PRIVATE `ai-import-uploads` (không public URL).
 *
 * Dùng SERVICE ROLE cho thao tác Storage — CHỈ sau khi nơi gọi đã xác thực user/role.
 * Ảnh chỉ để ĐỐI CHIẾU khi AI đọc sai; metadata ghi vào `uploaded_documents` qua RLS.
 *
 * ⚠️ Server-only. KHÔNG import ở client component.
 */
import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const AI_IMPORT_BUCKET = "ai-import-uploads";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** Tạo bucket private nếu chưa có (idempotent). Chỉ nhận ảnh, giới hạn dung lượng. */
export async function ensureAiImportBucket(maxBytes: number): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.storage.getBucket(AI_IMPORT_BUCKET);
  if (existing) return;
  const { error } = await admin.storage.createBucket(AI_IMPORT_BUCKET, {
    public: false,
    fileSizeLimit: maxBytes,
    allowedMimeTypes: ALLOWED,
  });
  if (error && !/already exists/i.test(error.message)) throw error;
}

/** Đuôi tệp an toàn theo mime (không tin tên tệp người dùng). */
export function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/**
 * Upload ảnh vào bucket private. `path` nên dạng `<profileId>/<date>/<batchId>/<random>.<ext>`
 * để phân vùng theo người dùng + không đoán được. Trả lỗi để nơi gọi xử lý (không chặn import).
 */
export async function uploadAiImportImage(
  path: string,
  data: Uint8Array,
  contentType: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage
    .from(AI_IMPORT_BUCKET)
    .upload(path, data, { contentType, upsert: false });
  if (error) throw error;
}

/** Tải ảnh gốc về (đối chiếu) — chỉ gọi server-side sau khi đã xác thực quyền. */
export async function downloadAiImportImage(path: string): Promise<Buffer | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(AI_IMPORT_BUCKET).download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
