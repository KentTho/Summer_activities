import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";
import { signInAdmin } from "@/lib/auth/actions";
import { getCurrentProfile } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/rbac";

/**
 * Đăng nhập Quản trị (Auth thật — Prompt 05).
 * Tài khoản Admin do khởi tạo hệ thống tạo (không cho tự đăng ký — spec §3).
 * Nếu đã đăng nhập hợp lệ thì chuyển thẳng về khu vực theo vai trò.
 */
export default async function AdminLoginPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect(homeForRole(profile.role));

  return (
    <LoginForm
      action={signInAdmin}
      accountLabel="Email quản trị"
      accountPlaceholder="admin@example.com"
      submitLabel="Đăng nhập Quản trị"
      footer={
        <>
          Chỉ tài khoản Quản trị viên mới đăng nhập được ở cổng này. Tài khoản do
          hệ thống cấp, không cho tự đăng ký.
        </>
      }
    />
  );
}
