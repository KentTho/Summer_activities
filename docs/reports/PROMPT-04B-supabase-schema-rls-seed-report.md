# Báo cáo PROMPT 04B — Supabase schema + RLS + seed + policy check

- **Ngày:** 2026-07-05
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-04A-fix-vercel-404-report.md`
- **Phạm vi:** tạo **schema thật + RLS + seed + smoke test** dạng file migration.
  **Không** làm Auth UI / CRUD UI / OCR / DOCX / gọi API thật. **Không** push remote/production.

---

## A — Bối cảnh & nguyên tắc an toàn đã áp dụng

- Supabase CLI **chưa cài** trên máy, **chưa `link`** project remote → theo quy tắc,
  **không tự cài token / không đoán project ref / không `db push`**. Chỉ tạo file
  migration/seed/test và hướng dẫn áp dụng.
- **Không** chạy seed lên production. Seed chỉ đánh dấu local/dev.
- RLS **deny-by-default**; không dùng `using (true)` ở bảng dữ liệu cá nhân.

## B — File đã tạo

```
supabase/migrations/20260705010000_core_schema.sql    # extensions, enums, 19 bảng, index, trigger, grants
supabase/migrations/20260705010100_rls_helpers.sql    # helper RBAC (security definer)
supabase/migrations/20260705010200_rls_policies.sql   # enable RLS + 71 policy theo vai trò
supabase/seed.sql                                      # seed local/dev (dữ liệu giả, không auth)
supabase/tests/rls_smoke.sql                           # smoke test RLS theo vai trò
supabase/config.toml                                   # thêm [db.seed]
```

## C — Schema (19 bảng, bám `data-model.md` + domain enums)

`profiles, neighborhoods, secretary_neighborhoods, guardians, students,
student_guardians, activity_sessions, session_neighborhoods, session_permissions,
attendance_records, leave_requests, notifications, notification_recipients,
uploaded_documents, import_batches, import_batch_rows, export_templates,
audit_logs, system_settings`.

- Enums khớp domain: `user_role, session_type, attendance_status, leave_status,
  notification_scope, import_source, import_status`.
- Khóa `uuid` + `gen_random_uuid()`; `created_at/updated_at` (+ trigger `set_updated_at`);
  soft delete (`deleted_at`) cho `students`, `activity_sessions`.
- FK rõ ràng (`on delete cascade/restrict/set null` theo ngữ nghĩa); index cho FK/lookup nóng.
- `students.neighborhood_id` **bắt buộc** (trục phân quyền lõi). `system_settings` single-row.
- Idempotent: enum guard, `create table/index if not exists`, `create or replace function`,
  `drop policy if exists` trước `create policy`.

## D — RBAC helpers (SECURITY DEFINER, tránh đệ quy RLS)

`current_profile_id`, `current_profile_role`, `is_admin`, `is_secretary`,
`can_access_neighborhood`, `can_access_student`, `can_access_session`, `is_guardian_of`.
Chạy dưới quyền owner → không bị RLS chặn khi policy gọi lại (đặc biệt trên `profiles`).
Trả về false/null an toàn khi `auth.uid()` null. Grant execute cho `anon, authenticated`.

## E — RLS policies (tóm tắt lý do)

- **Deny-by-default:** BẬT RLS trên **cả 19 bảng**; `anon` không có quyền bảng nhạy cảm.
- **students / attendance / leave / student_guardians (nhạy cảm — trẻ em):** Admin toàn quyền;
  Bí thư theo **Khu phố phụ trách** (`can_access_*`); Phụ huynh **chỉ con mình** (`is_guardian_of`).
- **attendance insert/update:** yêu cầu đồng thời `can_access_session` **và** `can_access_student`.
- **neighborhoods / system_settings:** đọc cho mọi người đăng nhập (danh mục/tên hệ thống);
  chỉ Admin thay đổi.
- **export_templates:** Admin quản lý; Bí thư chỉ đọc template đang bật.
- **audit_logs:** chỉ Admin đọc; ai cũng ghi hành động của mình; **không** update/delete (append-only).
- **session_permissions:** grant đặc biệt do **Admin** cấp.

## F — Seed (local/dev — dữ liệu giả)

5 Khu phố (KP05 inactive), 6 học sinh **giả** (tên "Học Sinh Demo A…F"), 2 phụ huynh,
3 buổi (2 thường + 1 chung), điểm danh buổi 1, 2 đơn nghỉ, 2 thông báo, 2 template,
1 dòng cấu hình. **Không** seed `auth.users`/`profiles` (để Auth phase tạo). Fixed UUID +
`on conflict do nothing` (idempotent).

## G — Smoke test RLS (`supabase/tests/rls_smoke.sql`)

Transaction tự tạo fixtures (admin/bí thư KP01/phụ huynh A) rồi **ROLLBACK**. Dùng
`set local role` + `set local request.jwt.claims` để giả lập `auth.uid()`. Khẳng định:

| Vai trò | Kỳ vọng |
| --- | --- |
| Admin | thấy **6** học sinh; `is_admin()` = true |
| Bí thư KP01 | thấy **3** HS KP01; **không** thấy KP02 |
| Phụ huynh A | thấy **đúng 1** (con mình) |
| Ẩn danh (anon) | thấy **0** |

Mỗi vi phạm → `raise exception FAIL…`.

## H — Kiểm tra chất lượng (app)

| Bước | Kết quả |
| --- | --- |
| `npm run lint` | ✅ Pass |
| `npm run typecheck` | ✅ Pass |
| `npm run build` | ✅ Pass (không đổi UI; chỉ thêm SQL/docs/config) |

Kiểm tra tĩnh SQL: enum khớp domain; **71 policy**; **0** chỗ `using (true)` ở bảng nhạy cảm.

## I — TypeScript types

`supabase gen types` **cần** CLI + DB (local hoặc remote) → hiện chưa chạy được. `Database`
trong `src/lib/types/index.ts` **giữ placeholder** (không bịa type). Lệnh sinh types khi sẵn sàng:
```bash
supabase gen types typescript --local > src/lib/database.types.ts
```

## J — ⚠️ Cần bạn cung cấp để áp dụng thật

Chưa `link` remote nên **chưa** áp schema lên Supabase thật. Để triển khai:

1. **Local (khuyến nghị test trước):** cài CLI → `supabase start` (cần Docker) →
   `supabase db reset` → chạy `supabase/tests/rls_smoke.sql` → `gen types`.
2. **Remote:** `supabase login` (bạn tự đăng nhập) → `supabase link --project-ref <REF>`
   → `supabase db push`. **KHÔNG** chạy seed demo lên production.
3. Nếu **remote đã có bảng/dữ liệu**: dừng, kiểm tra trước khi push (migration này giả định
   DB trống/dev; không có lệnh DROP).

## K — Tuân thủ quy tắc

- ✅ Không Auth/CRUD/OCR/DOCX/API thật; không sửa UI ngoài docs/config.
- ✅ Không push remote/production; không tự tạo token; không đoán project ref.
- ✅ RLS deny-by-default; helper `security definer`; audit append-only; không `using(true)` nhạy cảm.
- ✅ Migration idempotent; không DROP bảng; không disable RLS.
- ✅ `.env.local`/`.vercel/`/`.next/`/`node_modules` vẫn gitignore; không commit secret;
  không đưa service role vào client.
