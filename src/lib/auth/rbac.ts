/**
 * RBAC tiện ích cho tầng presentation (route guard, layout).
 * Nguồn Role là modules/auth/domain/roles.ts. Chặn cuối cùng vẫn là RLS ở Postgres
 * (xem docs/security.md) — lớp này chỉ là "tiện lợi" phía UI.
 */
import { ROLES, ROLE_HOME, type Role } from "@/modules/auth/domain/roles";

/** Prefix route được bảo vệ theo vai trò. */
export const PROTECTED_PREFIXES: Record<string, Role> = {
  "/admin": ROLES.ADMIN,
  "/secretary": ROLES.SECRETARY,
  "/parent": ROLES.PARENT,
};

/** Vai trò được yêu cầu cho một pathname, hoặc null nếu route công khai. */
export function requiredRoleForPath(pathname: string): Role | null {
  for (const [prefix, role] of Object.entries(PROTECTED_PREFIXES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return role;
    }
  }
  return null;
}

export function canAccessPath(role: Role, pathname: string): boolean {
  const required = requiredRoleForPath(pathname);
  return required === null || required === role;
}

export function homeForRole(role: Role): string {
  return ROLE_HOME[role];
}

export { ROLES, type Role };
