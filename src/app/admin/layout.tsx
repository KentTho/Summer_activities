import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout";
import { ROLES } from "@/modules/auth/domain/roles";

/**
 * Layout vai trò Admin. Phase sau: guard bằng getCurrentProfile() + rbac,
 * redirect nếu role !== ADMIN. Hiện chỉ dựng khung hiển thị.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role={ROLES.ADMIN}>{children}</DashboardShell>;
}
