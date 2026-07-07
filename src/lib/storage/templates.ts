/**
 * Lưu trữ tệp mẫu báo cáo DOCX trong bucket PRIVATE (không public URL).
 *
 * Dùng SERVICE ROLE cho thao tác Storage (tạo bucket/upload/download/signed URL)
 * — chỉ được gọi SAU khi đã `requireAdmin()` ở nơi gọi (guardrail 08C). Metadata
 * (uploaded_documents/export_templates) vẫn ghi qua RLS bằng client đăng nhập.
 *
 * ⚠️ Server-only. KHÔNG import ở client component.
 */
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const TEMPLATE_BUCKET = "report-templates";

/** Tạo bucket private nếu chưa có (idempotent). Giới hạn dung lượng + mime .docx. */
export async function ensureTemplateBucket(): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.storage.getBucket(TEMPLATE_BUCKET);
  if (existing) return;
  const { error } = await admin.storage.createBucket(TEMPLATE_BUCKET, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  });
  // Bỏ qua lỗi "đã tồn tại" (chạy song song). Lỗi khác thì ném để nơi gọi báo.
  if (error && !/already exists/i.test(error.message)) throw error;
}

/** Upload binary mẫu vào bucket private. `path` nên chứa UUID để tránh trùng/đoán. */
export async function uploadTemplateBinary(
  path: string,
  data: Uint8Array,
  contentType: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage
    .from(TEMPLATE_BUCKET)
    .upload(path, data, { contentType, upsert: false });
  if (error) throw error;
}

/** Tải binary mẫu về (để Admin xuất/tải lại). Trả Buffer hoặc null nếu không có. */
export async function downloadTemplateBinary(path: string): Promise<Buffer | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(TEMPLATE_BUCKET).download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
