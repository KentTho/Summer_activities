/**
 * Module: auth — Domain
 * Vai trò hệ thống (RBAC). Nguồn sự thật duy nhất cho role.
 * Spec §2 (Role & permission matrix) và §7 (Security plan / RBAC).
 *
 * Lưu ý: RBAC một mình chưa đủ — phạm vi thật phải ghép thêm bởi Khu phố
 * và quyền đặc biệt theo session (xem can_access_* helper trong docs/security.md).
 */

export const ROLES = {
  ADMIN: "ADMIN",
  SECRETARY: "SECRETARY",
  PARENT: "PARENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: readonly Role[] = Object.values(ROLES);

/** Đường dẫn dashboard mặc định theo vai trò. */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  SECRETARY: "/secretary",
  PARENT: "/parent",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ALL_ROLES as string[]).includes(value);
}
