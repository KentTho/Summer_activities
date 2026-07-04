import { LoginForm } from "@/components/forms/LoginForm";

/**
 * Đăng nhập Quản trị (Phase 03B shell) — chưa gọi Supabase Auth.
 * Tài khoản Admin do khởi tạo hệ thống tạo (không cho tự đăng ký — spec §3).
 */
export default function AdminLoginPage() {
  return (
    <LoginForm
      accountLabel="Email quản trị"
      accountPlaceholder="admin@example.com"
      submitLabel="Đăng nhập Quản trị (chưa kích hoạt)"
      footer={
        <>
          Phase 03B: khung đăng nhập. Supabase Auth + phân quyền ADMIN sẽ nối ở
          phase sau. Tài khoản Admin không cho tự đăng ký.
        </>
      }
    />
  );
}
