# Quên mật khẩu → Admin cấp lại (09E)

> Người dùng **không tự đổi** mật khẩu qua email/SMS. Họ gửi **yêu cầu**; Admin cấp **mật khẩu tạm**
> (bắt buộc đổi lần đầu). Không gửi email/SMS thật.
>
> **Phạm vi**: luồng này dành cho **Bí thư/Phụ huynh** (cổng Người dùng). **Admin gốc KHÔNG** dùng luồng
> công khai này — xem [`admin-access-recovery.md`](./admin-access-recovery.md). Form vẫn nhận `portal=admin`
> (hỗ trợ hệ thống nhiều Admin) nhưng **không** hiển thị nổi bật ở `/admin/login` (09F).

## Luồng
1. Người dùng bấm **"Quên mật khẩu?"** ở `/user/login` hoặc `/admin/login` → `/forgot-password?portal=user|admin`.
2. Nhập số điện thoại/tài khoản + chọn cổng → gửi. Thông báo **TRUNG LẬP**:
   *"Nếu tài khoản tồn tại, Quản trị viên sẽ xử lý…"* — **không tiết lộ** tài khoản có tồn tại hay không.
3. Admin thấy badge/alert PENDING ở `/admin` + trang `/admin/password-requests`.
4. Admin bấm **"Cấp mật khẩu tạm"** → reset auth user của hồ sơ khớp + `must_change_password=true`;
   mật khẩu tạm hiển thị **một lần** (không lưu/log). Yêu cầu chuyển **RESOLVED**.
5. Yêu cầu rác → **"Từ chối"** (REJECTED).

## Bảo mật
- Bảng `password_reset_requests` (migration additive `20260709010000`): RLS **chỉ Admin** đọc/cập nhật
  (`prr_admin_select`/`prr_admin_update`). **Không** policy insert → ghi CHỈ qua RPC.
- Ghi qua RPC `request_password_reset(p_identifier, p_portal)` **SECURITY DEFINER**:
  - Trung lập (luôn `void`), **không** lộ tồn tại tài khoản.
  - **Chống spam**: cùng identifier còn PENDING trong 24h ⇒ không tạo trùng.
  - Best-effort khớp hồ sơ (phone/email/synthetic email + đúng cổng) → `matched_profile_id`.
  - `grant execute` cho `anon, authenticated` (form công khai gọi được).
- Reset dùng service role **sau** `requireAdmin()` (guardrail 08A). Audit `RESOLVE_PASSWORD_RESET_REQUEST`
  / `REJECT_PASSWORD_RESET_REQUEST` — không PII/mật khẩu.

## Mã nguồn
- Migration: `supabase/migrations/20260709010000_password_reset_requests.sql`.
- Public: `src/app/forgot-password/{page,ForgotPasswordForm,actions}.tsx|ts`;
  data `src/lib/data/password-requests.ts`.
- Admin: `src/app/admin/(portal)/password-requests/{page,actions,ResolveRequestButton}.tsx|ts`;
  nav `Yêu cầu mật khẩu`; alert ở `/admin`.
