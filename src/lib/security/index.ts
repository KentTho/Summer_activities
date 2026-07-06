/**
 * Hằng số & tiện ích bảo mật dùng chung. Spec §7 (Security plan).
 * Phase 1: chỉ khai báo whitelist/hằng số; enforcement thật (rate limit, scan file,
 * signed URL) triển khai từ Phase 6/8 tại infrastructure của module liên quan.
 */

/** Whitelist định dạng file upload cho import giấy tờ cũ. */
export const ALLOWED_IMPORT_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

/** Whitelist định dạng template DOCX (KHÔNG cho .docm / macro). */
export const ALLOWED_TEMPLATE_MIME = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Giới hạn ảnh/PDF gửi đi OCR. OCR.space Free API giới hạn ~1MB/tệp nên đặt 1MB
 * để hỏng sớm (fail-fast) trước khi gọi API. Cũng chống DoS/parse tốn tài nguyên.
 */
export const MAX_OCR_UPLOAD_BYTES = 1024 * 1024; // 1MB

export interface FileCheckResult {
  ok: boolean;
  error?: string;
}

/**
 * Kiểm tra file upload cho OCR: bắt buộc có file, đúng mime whitelist, không rỗng,
 * không vượt giới hạn. Trả lỗi tiếng Việt thân thiện (không ném) để action xử lý.
 * Chống file thực thi/macro qua whitelist mime (ảnh + PDF).
 */
export function checkOcrUploadFile(file: File | null): FileCheckResult {
  if (!file || file.size === 0) return { ok: false, error: "Chưa chọn ảnh/PDF hợp lệ." };
  if (!(ALLOWED_IMPORT_MIME as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Chỉ chấp nhận ảnh (JPG/PNG/WebP) hoặc PDF." };
  }
  if (file.size > MAX_OCR_UPLOAD_BYTES) {
    return { ok: false, error: "Tệp quá lớn (tối đa 1MB cho OCR). Hãy giảm dung lượng ảnh." };
  }
  return { ok: true };
}

/** Field whitelist cho theme settings an toàn (không CSS/JS/HTML tùy ý). */
export const SYSTEM_SETTINGS_WHITELIST = [
  "system_name",
  "primary_color",
  "logo_document_id",
  "public_footer_text",
] as const;

/** Mã màu hex hợp lệ cho theme settings. */
export function isSafeHexColor(value: string): boolean {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/u.test(value);
}
