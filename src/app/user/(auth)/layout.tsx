import type { ReactNode } from "react";
import { AuthShell } from "@/components/layout";

/** Cổng đăng nhập Người dùng (/user/login) — Bí thư & Phụ huynh/Học sinh. */
export default function UserAuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell
      portalLabel="Cổng Người dùng"
      portalHint="Bí thư · Phụ huynh / Học sinh"
    >
      {children}
    </AuthShell>
  );
}
