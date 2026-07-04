import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";

/**
 * Đăng nhập Người dùng (Phase 03B shell) — chưa gọi Supabase Auth.
 * Sau khi bật auth thật, đăng nhập thành công sẽ redirect theo vai trò
 * (SECRETARY → /user/secretary, PARENT → /user/parent) qua ROLE_HOME.
 * Chiến lược tài khoản: xem docs/auth-strategy.md.
 */
export default function UserLoginPage() {
  return (
    <LoginForm
      accountLabel="Tài khoản"
      accountPlaceholder="Email / số điện thoại / mã tài khoản"
      submitLabel="Đăng nhập (chưa kích hoạt)"
      footer={
        <>
          <p>
            Phase 03B: khung đăng nhập. Đăng nhập thành công sẽ tự chuyển đến khu
            vực theo vai trò (Bí thư hoặc Phụ huynh/Học sinh).
          </p>
          <p className="mt-2 text-slate-400">
            Xem trước shell:{" "}
            <Link
              href="/user/secretary"
              className="font-medium text-indigo-600 hover:underline"
            >
              Bí thư
            </Link>{" "}
            ·{" "}
            <Link
              href="/user/parent"
              className="font-medium text-indigo-600 hover:underline"
            >
              Phụ huynh / Học sinh
            </Link>
          </p>
        </>
      }
    />
  );
}
