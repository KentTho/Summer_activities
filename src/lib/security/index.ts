/**
 * Hằng số & tiện ích bảo mật dùng chung. Spec §7 (Security plan).
 * Phase 1: chỉ khai báo whitelist/hằng số; enforcement thật (rate limit, scan file,
 * signed URL) triển khai từ Phase 6/8 tại infrastructure của module liên quan.
 */

/** Whitelist định dạng ẢNH cho AI import (Gemini Vision). PDF chưa hỗ trợ → chặn. */
export const ALLOWED_AI_IMPORT_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Whitelist định dạng template DOCX (KHÔNG cho .docm / macro). */
export const ALLOWED_TEMPLATE_MIME = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export interface FileCheckResult {
  ok: boolean;
  error?: string;
}

/**
 * Kiểm tra ảnh upload cho AI import: bắt buộc có file, đúng mime ảnh whitelist,
 * không rỗng, không vượt `maxBytes`. Trả lỗi tiếng Việt thân thiện (không ném).
 * Chỉ nhận ẢNH (JPG/PNG/WebP) — PDF hiện chưa hỗ trợ, báo người dùng chụp ảnh.
 */
export function checkAiImportFile(file: File | null, maxBytes: number): FileCheckResult {
  if (!file || file.size === 0) return { ok: false, error: "Chưa chọn ảnh hợp lệ." };
  if (file.type === "application/pdf") {
    return { ok: false, error: "Hiện chưa hỗ trợ PDF. Hãy chụp/ tải ảnh (JPG/PNG/WebP)." };
  }
  if (!(ALLOWED_AI_IMPORT_MIME as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Chỉ chấp nhận ảnh JPG/PNG/WebP." };
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `Ảnh quá lớn (tối đa ${mb}MB). Hãy giảm dung lượng ảnh.` };
  }
  return { ok: true };
}

/**
 * Kiểm tra tệp mẫu báo cáo DOCX trước khi lưu trữ:
 *  - Bắt buộc có tệp, không rỗng, ≤ MAX_UPLOAD_BYTES.
 *  - Đuôi `.docx` (KHÔNG `.docm`) + mime whitelist WordprocessingML.
 *  - Magic bytes ZIP (PK\x03\x04) — chặn tệp giả đuôi.
 *  - Quét chuỗi macro (`vbaProject`, content-type macroEnabled) trong nội dung
 *    ZIP để chặn tệp chứa macro dù đổi đuôi thành .docx.
 * Trả lỗi tiếng Việt (không ném) để action xử lý mượt.
 */
export function checkTemplateUploadFile(file: File | null, bytes: Uint8Array | null): FileCheckResult {
  if (!file || file.size === 0 || !bytes || bytes.length === 0) {
    return { ok: false, error: "Chưa chọn tệp .docx hợp lệ." };
  }
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".docm") || !lower.endsWith(".docx")) {
    return { ok: false, error: "Chỉ nhận tệp .docx (không nhận .docm/macro)." };
  }
  if (file.type && !(ALLOWED_TEMPLATE_MIME as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Định dạng tệp không đúng chuẩn .docx (WordprocessingML)." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Tệp quá lớn (tối đa 10MB)." };
  }
  // Magic bytes ZIP: 50 4B 03 04 (docx là gói ZIP).
  if (!(bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04)) {
    return { ok: false, error: "Tệp không phải gói .docx hợp lệ (thiếu chữ ký ZIP)." };
  }
  // Quét macro: tên tệp trong ZIP nằm dạng văn bản thuần trong local file header.
  const ascii = Buffer.from(bytes).toString("latin1");
  if (ascii.includes("vbaProject") || ascii.includes("macroEnabled")) {
    return { ok: false, error: "Tệp chứa macro — không được phép. Hãy dùng .docx không macro." };
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
