import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout";
import { ROLES } from "@/modules/auth/domain/roles";

/**
 * Layout khu vực quản trị (sau đăng nhập). Phase sau: guard bằng
 * getCurrentProfile() + rbac, redirect về /admin/login nếu role !== ADMIN.
 * Route group (portal) tách chrome dashboard khỏi trang /admin/login.
 */
export default function AdminPortalLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role={ROLES.ADMIN}>{children}</DashboardShell>;
}
