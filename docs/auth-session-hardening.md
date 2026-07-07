# Auth / Session Hardening Checklist

> Prompt 09A. Rút gọn nhóm **Auth Session / JWT** thành checklist cho dự án.
> Bổ trợ `auth-strategy.md`, `security.md`, `engineering-guardrails.md §1`.

## Nguyên tắc đang áp dụng
- [x] **Không tin client.** Server xác minh `auth.getUser()` (không đọc cookie thô); **RLS** là chặn cuối.
- [x] **Session qua Supabase SSR** (`@supabase/ssr`) + cookie; refresh trong `proxy.ts`.
      **KHÔNG** lưu token ở `localStorage`, không tự parse JWT ở client để phân quyền.
- [x] **Logout = thu hồi phía server** (`auth.signOut()`), không chỉ xóa cookie.
- [x] **Service role** chỉ dùng server-side sau khi xác thực vai trò (tạo/reset tài khoản, Storage mẫu).
      Không bao giờ ra client (guard runtime trong `lib/supabase/admin.ts`).
- [x] **Ép đổi mật khẩu lần đầu**: cờ `must_change_password` ở auth `user_metadata`; layout cổng
      redirect `/change-password`; đổi xong xóa cờ (`auth.updateUser`). Reset của Admin bật lại cờ.

## Kiểm khi thêm/sửa tính năng auth
- [ ] Route handler (không qua layout guard) phải **tự** `getCurrentProfile()` + kiểm vai trò.
- [ ] Trang/nghiệp vụ mới có nằm trong `PROTECTED_PREFIXES` không? Nếu cần login mà không, thêm guard.
- [ ] Mọi quyết định quyền có RLS backing không? (UI/middleware chỉ là tiện lợi.)
- [ ] Thông báo lỗi đăng nhập **trung lập** ("email hoặc mật khẩu không đúng"), không lộ tồn tại tài khoản.

## Backlog (chưa cần — KHÔNG build vội)
- [ ] **Logout-all / token-version**: vô hiệu hóa phiên hàng loạt khi đổi mật khẩu/nghi lộ token.
      Dùng `session_not_before` của Supabase hoặc cột `token_version` trong `profiles`. Ghi để cân nhắc.
- [ ] MFA / đăng nhập bằng OTP điện thoại thật.
- [ ] Rate-limit đăng nhập / khóa tạm sau nhiều lần sai.
