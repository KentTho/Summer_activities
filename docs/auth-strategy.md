# Chiến lược tài khoản & đăng nhập

> Cập nhật ở Prompt 05. Bổ trợ cho `security.md` (spec §7).
> **Trạng thái:** ✅ Auth thật **đã bật** (Supabase Auth email + mật khẩu, RBAC guard theo
> `profiles.role`, redirect theo vai trò, logout). Xem `docs/reports/PROMPT-05-...report.md`.

## 1. Tách hai cổng đăng nhập

Hệ thống chia hai cổng độc lập để giảm bề mặt tấn công và tách trải nghiệm:

| Cổng | Đường dẫn | Đối tượng |
| --- | --- | --- |
| **Admin** | `/admin/login` → `/admin` | Quản trị viên hệ thống |
| **Người dùng** | `/user/login` → `/user/secretary` \| `/user/parent` | Bí thư · Phụ huynh/Học sinh |

- Trang chủ `/` là entry page, có 2 nút: **Vào cổng Admin** và **Vào cổng Người dùng**.
- Route cũ (`/login`, `/secretary`, `/parent`) được **redirect** sang cấu trúc mới
  (xem `next.config.ts`), không xóa cứng link cũ.

## 2. Redirect theo vai trò sau đăng nhập

Đăng nhập thành công ở cổng Người dùng sẽ điều hướng theo `ROLE_HOME`
(`modules/auth/domain/roles.ts`):

- `SECRETARY` → `/user/secretary`
- `PARENT` → `/user/parent`
- `ADMIN` → `/admin` (chỉ qua cổng Admin)

Route được bảo vệ theo prefix trong `lib/auth/rbac.ts` (`PROTECTED_PREFIXES`);
trang login của mỗi cổng nằm trong `PUBLIC_PATHS` để không bị guard chặn.

## 3. Chiến lược tài khoản (Open question spec §10)

- **Admin:** tài khoản do khởi tạo hệ thống tạo. **Không** cho tự đăng ký
  (`supabase/config.toml`: `enable_signup = false`).
- **Bí thư:** do Admin tạo, gán Khu phố phụ trách; đăng nhập bằng email.
- **Phụ huynh/Học sinh:** phương án định danh **chưa chốt** — cân nhắc:
  email · số điện thoại · mã tài khoản do Bí thư cấp. Trường tài khoản ở
  `/user/login` để nhãn trung lập ("Email / số điện thoại / mã tài khoản")
  cho tới khi chốt.

## 4. Ranh giới bảo mật khi bật Auth thật (Phase 2+)

1. `lib/auth/session.ts#getCurrentProfile()` đọc user Supabase → map `profiles`
   (role, full_name, status).
2. `proxy.ts` (route guard) dùng `requiredRoleForPath()` để redirect khi thiếu quyền.
3. Chặn cuối cùng vẫn là **RLS ở Postgres** — tầng UI/proxy chỉ là lớp tiện lợi.
4. Rate limit đăng nhập theo IP + user; reset mật khẩu chặt hơn (xem `security.md`).
5. `SUPABASE_SERVICE_ROLE_KEY` **chỉ dùng server-side**, không bao giờ vào client component.

## 5. Đã triển khai ở Prompt 05

- **Login thật:** `signInWithPassword` qua Server Action (`lib/auth/actions.ts`);
  kiểm tra vai trò khớp cổng; redirect theo `ROLE_HOME`.
- **Session thật:** `lib/auth/session.ts#getCurrentProfile()` → `auth.getUser()` + `profiles`.
- **Guard 2 lớp:** middleware `proxy.ts` (chưa đăng nhập → login đúng cổng) + server layout
  (sai vai trò → về khu vực đúng vai trò). RLS Postgres là chặn cuối cùng.
- **Logout thật:** Server Action `signOut` trong `DashboardShell`.
- **Admin client server-only:** `lib/supabase/admin.ts` (service role, không ra client).
- **Bootstrap demo users:** `scripts/bootstrap-auth-users.mjs` (chỉ chạy khi có service role key).

### Còn để lại (phase sau)
- Định danh phụ huynh bằng SĐT/mã tài khoản (hiện dùng email).
- Rate limit đăng nhập theo IP + user; reset mật khẩu.
- CRUD tài khoản (Admin tạo Bí thư/Phụ huynh) — Prompt CRUD.
