import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout";
import { ROLES } from "@/modules/auth/domain/roles";

/** Khu vực Bí thư (trong cổng Người dùng). Guard theo Khu phố ở phase sau. */
export default function SecretaryLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role={ROLES.SECRETARY}>{children}</DashboardShell>;
}
