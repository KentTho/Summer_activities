import { AuthShell } from "@/components/layout";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

/**
 * Trang QUÊN MẬT KHẨU (công khai) — CHỈ cho Người dùng (Bí thư/Phụ huynh).
 * Quản trị viên KHÔNG dùng luồng này (khôi phục Admin qua break-glass máy chủ — xem
 * docs/admin-access-recovery.md). Không tự đổi mật khẩu; gửi yêu cầu để Admin cấp lại.
 */
export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  return (
    <AuthShell
      portalLabel="Quên mật khẩu"
      portalHint="Gửi yêu cầu để Quản trị viên cấp lại mật khẩu tạm."
    >
      <ForgotPasswordForm defaultPortal="USER" backHref="/user/login" />
    </AuthShell>
  );
}
