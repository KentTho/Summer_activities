import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";
import { signInUser } from "@/lib/auth/actions";
import { getCurrentProfile } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/rbac";

/**
 * Đăng nhập Người dùng (Auth thật — Prompt 05) — Bí thư & Phụ huynh/Học sinh.
 * Đăng nhập thành công sẽ redirect theo vai trò (SECRETARY → /user/secretary,
 * PARENT → /user/parent) qua ROLE_HOME. Hiện dùng email + mật khẩu.
 * Chiến lược định danh phụ huynh: xem docs/auth-strategy.md.
 */
export default async function UserLoginPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect(homeForRole(profile.role));

  return (
    <LoginForm
      action={signInUser}
      accountLabel="Tài khoản (số điện thoại hoặc email)"
      accountPlaceholder="0932077136"
      submitLabel="Đăng nhập"
      forgotHref="/forgot-password?portal=user"
      footer={
        <p>
          Đăng nhập thành công sẽ tự chuyển đến khu vực theo vai trò (Bí thư hoặc
          Phụ huynh/Học sinh). Tài khoản do Quản trị/Bí thư cấp.
        </p>
      }
    />
  );
}
