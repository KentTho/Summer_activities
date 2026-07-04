import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout";
import { ROLES } from "@/modules/auth/domain/roles";

/** Layout vai trò Bí thư. Guard theo phạm vi Khu phố sẽ thêm ở phase sau. */
export default function SecretaryLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role={ROLES.SECRETARY}>{children}</DashboardShell>;
}
