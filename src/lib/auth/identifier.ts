/**
 * Chuẩn hóa "login identifier" → email dùng cho Supabase Auth (signInWithPassword).
 * Cho phép người dùng đăng nhập bằng:
 *   - Email thật (chứa "@") → dùng nguyên văn.
 *   - Số điện thoại (chỉ chữ số, có thể có "+") → `<digits>@sinhhoathe.local`.
 *   - Tên tài khoản (vd "Admin") → `<slug>@sinhhoathe.local`.
 *
 * Ánh xạ mang tính TẤT ĐỊNH: script bootstrap và hàm đăng nhập PHẢI dùng cùng quy tắc.
 * (Bản sao JS thuần trong scripts/bootstrap-auth-users.mjs phải giữ đồng bộ.)
 */
export const SYNTHETIC_EMAIL_DOMAIN = "sinhhoathe.local";

export function identifierToEmail(rawInput: string): string {
  const input = rawInput.trim();
  if (input.includes("@")) return input.toLowerCase();

  const digits = input.replace(/[^\d]/g, "");
  const isPhone = /^\+?\d[\d\s.-]*$/.test(input) && digits.length >= 6;
  const local = isPhone
    ? digits
    : input.toLowerCase().replace(/[^a-z0-9]/g, "");

  return `${local}@${SYNTHETIC_EMAIL_DOMAIN}`;
}
