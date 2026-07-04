import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout";
import { ROLES } from "@/modules/auth/domain/roles";

/** Layout vai trò Phụ huynh/Học sinh. */
export default function ParentLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role={ROLES.PARENT}>{children}</DashboardShell>;
}
