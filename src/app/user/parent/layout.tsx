import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout";
import { getCurrentProfile } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/rbac";
import { ROLES } from "@/modules/auth/domain/roles";

/**
 * Khu vực Phụ huynh/Học sinh (trong cổng Người dùng) — RBAC guard thật (Prompt 05).
 * Chưa đăng nhập → /user/login; sai vai trò → về khu vực đúng của vai trò.
 * Chỉ xem được dữ liệu con mình (đảm bảo bởi RLS is_guardian_of).
 */
export default async function ParentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/user/login");
  if (profile.role !== ROLES.PARENT) redirect(homeForRole(profile.role));
  if (profile.mustChangePassword) redirect("/change-password");

  return (
    <DashboardShell role={ROLES.PARENT} fullName={profile.fullName}>
      {children}
    </DashboardShell>
  );
}
