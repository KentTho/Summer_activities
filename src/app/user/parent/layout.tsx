import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout";
import { ROLES } from "@/modules/auth/domain/roles";

/** Khu vực Phụ huynh/Học sinh (trong cổng Người dùng). */
export default function ParentLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role={ROLES.PARENT}>{children}</DashboardShell>;
}
