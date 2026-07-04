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
