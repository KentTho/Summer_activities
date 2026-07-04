import type { ReactNode } from "react";
import { AuthShell } from "@/components/layout";

/** Cổng đăng nhập Quản trị (/admin/login). Tách khỏi chrome dashboard. */
export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell
      portalLabel="Cổng Quản trị"
      portalHint="Dành cho quản trị viên hệ thống"
    >
      {children}
    </AuthShell>
  );
}
