/**
 * Module: auth — Domain
 * Chức danh hiển thị cho tài khoản role SECRETARY. "Bí thư" và "Chi Đoàn" dùng
 * CHUNG quyền SECRETARY — chỉ khác nhãn/chức danh, KHÔNG phải role mới.
 */
export const STAFF_TITLES = ["Bí thư", "Chi Đoàn"] as const;
export type StaffTitle = (typeof STAFF_TITLES)[number];
export const DEFAULT_STAFF_TITLE: StaffTitle = "Bí thư";

export function isStaffTitle(value: unknown): value is StaffTitle {
  return typeof value === "string" && (STAFF_TITLES as readonly string[]).includes(value);
}
