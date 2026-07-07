import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout";
import { getCurrentProfile } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/rbac";
import { ROLES } from "@/modules/auth/domain/roles";

/**
 * Khu vực Bí thư (trong cổng Người dùng) — RBAC guard thật (Prompt 05).
 * Chưa đăng nhập → /user/login; sai vai trò → về khu vực đúng của vai trò.
 * Phạm vi theo Khu phố vẫn do RLS Postgres đảm bảo.
 */
export default async function SecretaryLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/user/login");
  if (profile.role !== ROLES.SECRETARY) redirect(homeForRole(profile.role));
  if (profile.mustChangePassword) redirect("/change-password");

  return (
    <DashboardShell role={ROLES.SECRETARY} fullName={profile.fullName}>
      {children}
    </DashboardShell>
  );
}
