import { AuthShell } from "@/components/layout";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

/**
 * Trang QUÊN MẬT KHẨU (công khai). Người dùng gửi yêu cầu → Admin cấp mật khẩu tạm.
 * KHÔNG tự đổi mật khẩu ở đây. `?portal=admin|user` chọn cổng mặc định.
 */
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ portal?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const { portal } = await searchParams;
  const isAdmin = (portal ?? "").toLowerCase() === "admin";
  const defaultPortal = isAdmin ? "ADMIN" : "USER";
  const backHref = isAdmin ? "/admin/login" : "/user/login";

  return (
    <AuthShell
      portalLabel="Quên mật khẩu"
      portalHint="Gửi yêu cầu để Quản trị viên cấp lại mật khẩu tạm."
    >
      <ForgotPasswordForm defaultPortal={defaultPortal} backHref={backHref} />
    </AuthShell>
  );
}
