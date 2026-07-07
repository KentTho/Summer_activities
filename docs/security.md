# Kế hoạch bảo mật (tóm tắt spec §7)

## RBAC + phạm vi
Role `ADMIN` / `SECRETARY` / `PARENT` (`modules/auth/domain/roles.ts`). RBAC **chưa đủ** — phạm vi
thật ghép thêm bởi **Khu phố** và **quyền đặc biệt theo session chung**.

## RLS (chặn cuối cùng)
Bật trên mọi bảng nghiệp vụ, viết qua helper function thay vì lặp policy dài. **Tầng UI/`proxy.ts`
chỉ là lớp tiện lợi**; chặn cuối cùng ở Postgres RLS để tránh lộ dữ liệu do bug frontend/API.

## Audit log (bắt buộc)
Log: tạo/sửa/xóa học sinh, gán Bí thư, reset mật khẩu, tạo/sửa session, điểm danh, import, export,
đổi template, đổi cấu hình. Nội dung: ai/khi nào/entity/before-after/IP/user-agent/request-id.
Không cho sửa/xóa audit log từ UI thường.

## Input validation (2 tầng)
Client form + server schema bằng **Zod** (`lib/validation`). Chuẩn hóa số điện thoại/ngày sinh/tên
trường/Khu phố trước khi ghi. Chặn mass assignment bằng **whitelist field** cho từng use case.

## File upload
Whitelist định dạng (ảnh, PDF scan, DOCX template — xem `lib/security`). Chặn `.docm`/macro. Kiểm
mime + extension + size + hash. Bucket riêng **không public**; phát qua signed URL ngắn hạn.

## Mật khẩu
Không lưu plaintext ở bất kỳ bảng nào. Dùng Supabase Auth để băm/quản lý. Reset qua link đặt lại
hoặc mật khẩu tạm buộc đổi lần đầu. Bí thư/Admin không bao giờ xem mật khẩu thật.

## Theme settings an toàn
Chỉ field whitelist (`SYSTEM_SETTINGS_WHITELIST` trong `lib/security`): tên hệ thống, logo, mã màu
hợp lệ, footer. **Không** có trường nhập CSS/JS/HTML tùy ý.

## Rate limiting (đề xuất)
Đăng nhập (theo IP + user) · reset password (chặt hơn + cooldown) · import/export (theo user) ·
API đọc dữ liệu nhạy cảm (throttle ở edge/proxy).

## Environment variables
`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(tên cũ `NEXT_PUBLIC_SUPABASE_ANON_KEY` vẫn đọc được — backward-compat) · `SUPABASE_SERVICE_ROLE_KEY` ·
`APP_BASE_URL` · `GEMINI_API_KEY` / `GEMINI_MODEL` (AI import, server-only) · (sau) `AUDIT_LOG_SECRET`,
`DOCX_TEMPLATE_BUCKET`, `IMPORT_BUCKET`.
Xem `.env.example`. **Không hardcode secret; không commit `.env.local`.**

> ⚠️ **Không đặt key thật trong `.env.example`** (file này được commit). Chỉ để placeholder
> rỗng; giá trị thật nằm ở `.env.local` (gitignored) hoặc biến môi trường của Vercel.

---

## Session / Auth / JWT (bổ sung Prompt 06B)

Nền tảng: **Supabase Auth** (không tự cuộn crypto). Tóm tắt cách dự án dùng phiên:

- **Access token = JWT ngắn hạn** (mặc định ~1h) + **refresh token** dài hạn. Client
  không tự parse/verify JWT để phân quyền — luôn hỏi lại Auth server.
- **Xác thực chứ không tin cookie thô:** phía server dùng `supabase.auth.getUser()`
  (`src/lib/auth/session.ts`) để **xác minh** token với Auth server, **không** dùng
  `getSession()` (đọc cookie chưa verify) cho quyết định bảo mật.
- **Guard 2 lớp** (Prompt 05): middleware `proxy.ts` (chưa đăng nhập → login đúng cổng)
  + layout theo vai trò (sai vai trò → `ROLE_HOME`). **Chặn cuối cùng vẫn là RLS.**
- **Cookie phiên** do `@supabase/ssr` quản lý: `HttpOnly`, `Secure` (prod), `SameSite=Lax`
  → giảm XSS đánh cắp token + CSRF cơ bản. Server Actions của Next kiểm origin (chống CSRF).
- **Service role JWT** (`SUPABASE_SERVICE_ROLE_KEY`) bỏ qua RLS → **chỉ** dùng server-side
  trong script bootstrap; **không** dùng ở UI/CRUD (đi qua RLS). Guard runtime chặn client
  (`src/lib/supabase/admin.ts`).
- **Xoay/rút phiên:** đăng xuất gọi `auth.signOut()` (thu hồi refresh token phía server).
  Đổi mật khẩu → buộc đăng nhập lại. Tài khoản khởi tạo đặt cờ `must_change_password`.
- **Đề xuất tiếp:** bật rate-limit đăng nhập/refresh, rút ngắn TTL cho vai trò nhạy cảm,
  log phiên bất thường (đổi IP/UA đột ngột) vào audit.

## AI import (Gemini)
Xem `docs/ai-security-checklist.md` và `docs/gemini-ai-import.md`. Nguyên tắc cốt lõi:
**key AI ở server**, AI **không auto-ghi** dữ liệu thật, mọi output AI qua **duyệt tay**
trước khi commit. OCR.space đã bị thay thế ở Prompt 09B.
