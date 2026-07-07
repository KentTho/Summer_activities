import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout";
import { getCurrentProfile } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/rbac";
import { ROLES } from "@/modules/auth/domain/roles";

/**
 * Layout khu vực Quản trị (sau đăng nhập) — RBAC guard thật (Prompt 05):
 * chưa đăng nhập → /admin/login; sai vai trò → về khu vực đúng của vai trò.
 * Chặn cuối cùng vẫn là RLS ở Postgres.
 */
export default async function AdminPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  if (profile.role !== ROLES.ADMIN) redirect(homeForRole(profile.role));
  if (profile.mustChangePassword) redirect("/change-password");

  return (
    <DashboardShell role={ROLES.ADMIN} fullName={profile.fullName}>
      {children}
    </DashboardShell>
  );
}
