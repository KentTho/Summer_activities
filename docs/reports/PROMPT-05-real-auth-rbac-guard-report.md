# Báo cáo PROMPT 05 — Real Auth + RBAC guard + role redirect + logout

- **Ngày:** 2026-07-05
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-04D-finalize-supabase-apply-types-report.md`
- **Phạm vi:** Auth thật (Supabase Auth), RBAC guard theo `profiles.role`, redirect theo vai
  trò, logout, admin client server-only, script bootstrap demo. **Không** CRUD/Attendance/OCR/
  DOCX/Notification thật; **không** nâng cấp UI lớn; **không** đụng schema/RLS.

---

## A — Tóm tắt kiến trúc Auth

| Thành phần | File | Vai trò |
| --- | --- | --- |
| Server Actions | `src/lib/auth/actions.ts` | `signInAdmin`, `signInUser`, `signOut` (`"use server"`) |
| Session/profile | `src/lib/auth/session.ts` | `getCurrentProfile()` + `loadProfileForAuthUser()` |
| RBAC map | `src/lib/auth/rbac.ts` (có sẵn) | `requiredRoleForPath`, `homeForRole`, prefix bảo vệ |
| Middleware guard | `src/proxy.ts` | chưa đăng nhập + route bảo vệ → redirect login đúng cổng |
| Layout guard | `admin/(portal)`, `user/secretary`, `user/parent` layouts | sai vai trò → redirect `ROLE_HOME` |
| Login UI | `src/components/forms/LoginForm.tsx` | client + `useActionState` (lỗi + pending) |
| Logout UI | `src/components/layout/DashboardShell.tsx` | `<form action={signOut.bind(null, portal)}>` |
| Admin client | `src/lib/supabase/admin.ts` | service role, **server-only** (guard runtime) |
| Bootstrap demo | `scripts/bootstrap-auth-users.mjs` | tạo demo users + profiles (idempotent, gated) |

**Luồng đăng nhập:** form → Server Action → `signInWithPassword` → đọc `profiles` (role, active)
→ kiểm tra vai trò khớp cổng → `redirect(ROLE_HOME[role])`.
Lỗi (sai mật khẩu / sai cổng / không hồ sơ) → `signOut()` + thông báo trung lập, không rò rỉ chi tiết.

## B — Redirect theo vai trò (yêu cầu 5)

| Vai trò | Đích sau đăng nhập |
| --- | --- |
| ADMIN | `/admin` |
| SECRETARY | `/user/secretary` |
| PARENT | `/user/parent` |

## C — Chặn truy cập sai cổng (yêu cầu 6) — phòng thủ 2 lớp

1. **Middleware** (`proxy.ts`): route bảo vệ + **chưa đăng nhập** → redirect `/admin/login`
   hoặc `/user/login` (đúng cổng theo prefix).
2. **Server layout**: đã đăng nhập nhưng **sai vai trò** → redirect về `ROLE_HOME` của chính
   vai trò đó ⇒ Parent không vào Secretary/Admin; Secretary không vào Admin/Parent; Admin
   không bị đẩy sai. Trang login nếu đã đăng nhập hợp lệ → chuyển thẳng về khu vực vai trò.
3. **RLS Postgres** vẫn là chặn cuối cùng cho dữ liệu (theo Khu phố / con của phụ huynh).

## D — Kiểm thử guard (local `next start`)

| Route (chưa đăng nhập) | Kết quả |
| --- | --- |
| `/admin`, `/admin/neighborhoods` | **307 → `/admin/login`** ✅ |
| `/user/secretary`, `/user/secretary/students` | **307 → `/user/login`** ✅ |
| `/user/parent` | **307 → `/user/login`** ✅ |
| `/admin/login`, `/user/login`, `/api/health`, `/gioi-thieu`, `/` | **200** ✅ |

> Redirect **chéo cổng theo vai trò** (đã đăng nhập, sai vai trò) được kiểm tra qua code
> (layout `getCurrentProfile` + `homeForRole`); **chưa test end-to-end** vì chưa có demo users
> (thiếu service role key — xem §F).

## E — Admin client server-only (yêu cầu 8)

- `src/lib/supabase/admin.ts` dùng `SUPABASE_SERVICE_ROLE_KEY`, `createClient<Database>`
  (bỏ qua RLS). Guard runtime: ném lỗi nếu bị nạp trong trình duyệt; **không** được import từ
  bất kỳ component `"use client"` nào. `server-only` package chưa cài nên dùng guard thủ công.

## F — Bootstrap demo users (yêu cầu 9) — SKIP chạy, đã tạo script

- `scripts/bootstrap-auth-users.mjs` + `npm run bootstrap:auth`
  (`node --env-file=.env.local ...`). Tạo 3 tài khoản **demo (dữ liệu giả)**:
  `admin.demo@…`, `bithu.demo@…`, `phuhuynh.demo@…` (ADMIN/SECRETARY/PARENT), `email_confirm`,
  upsert `profiles` theo `auth_user_id`. **Idempotent**. Mật khẩu đọc từ `DEMO_USER_PASSWORD`
  (không hardcode); thiếu thì sinh ngẫu nhiên và in ra.
- **`SUPABASE_SERVICE_ROLE_KEY` hiện KHÔNG có trong `.env.local` → chưa chạy script**, chưa tạo
  demo users. Đúng quy tắc: thiếu key thì hoàn thành Auth UI/guard/login và skip phần tạo users.
- Muốn chạy: điền `SUPABASE_SERVICE_ROLE_KEY` (server-only) vào `.env.local` rồi
  `npm run bootstrap:auth`. Cân nhắc chỉ chạy trên project dev — không đưa demo lên production.

## G — Env & bảo mật

- `src/lib/env.ts`: thêm `hasServiceRoleKey()`. Service role **chỉ** đọc trong `admin.ts`/script.
- `.env.example`: thêm `DEMO_USER_PASSWORD` (chú thích local/dev).
- Không commit `.env.local`/secret/service role/DB password (đã gitignore).
- `eslint.config.mjs`: ignore `scripts/**` (script Node vận hành, ngoài bundle app).

## H — Kiểm tra chất lượng

| Bước | Kết quả |
| --- | --- |
| `npm run lint` | ✅ Pass |
| `npm run typecheck` | ✅ Pass |
| `npm run build` | ✅ Pass (route auth-guarded chuyển sang dynamic `ƒ` như kỳ vọng) |
| Guard redirect (local) | ✅ Như bảng §D |

**Sự cố đã xử lý:** lần test guard đầu trả 200 do một tiến trình `next start` cũ còn giữ
cổng 3000 (`EADDRINUSE`) → curl trúng build cũ. Đã `taskkill` tiến trình cũ, chạy lại trên
cổng sạch → guard trả 307 đúng.

## I — Tuân thủ quy tắc

- ✅ Không CRUD/Attendance/OCR/DOCX/Notification thật; không nâng cấp UI lớn.
- ✅ Không đụng schema/RLS; không `db reset`/seed remote; không drop table; không disable RLS.
- ✅ Service role chỉ server-only; không vào client; không hardcode mật khẩu.
- ✅ Thiếu service role key → skip tạo demo users và ghi rõ (không tự đoán key).
- ✅ Lint/typecheck/build không bị tắt để né lỗi; lỗi phát sinh đã chẩn đoán & sửa gốc.
