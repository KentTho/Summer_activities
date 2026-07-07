import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { getCurrentProfile } from "@/lib/auth/session";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

/**
 * Trang đổi mật khẩu — dùng chung mọi vai trò. Nằm NGOÀI các layout cổng để tránh
 * vòng lặp redirect khi cờ `must_change_password` bật (các layout cổng redirect về đây).
 * Chưa đăng nhập → về cổng Người dùng.
 */
export default async function ChangePasswordPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/user/login");

  return (
    <AuthShell portalLabel="Bảo mật tài khoản" portalHint="Đổi mật khẩu để tiếp tục">
      <ChangePasswordForm forced={profile.mustChangePassword} />
    </AuthShell>
  );
}
