# Báo cáo PROMPT 04D — Finalize Supabase apply + types + deploy check

- **Ngày:** 2026-07-05
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-04C-connect-supabase-env-vercel-report.md`
- **Phạm vi:** xác nhận migration đã áp remote, sinh + nối TypeScript database types thật,
  kiểm tra `/api/health`, redeploy. **Không** Auth/CRUD/OCR/DOCX/Notification thật.
- **Project ref:** `ymtogeacpnlmthjlryrd`

---

## A — Hiện trạng công cụ & link

| Mục | Kết quả |
| --- | --- |
| Supabase CLI (npx) | ✅ `2.109.0` (user đã cài Docker + CLI thủ công) |
| Local stack | ✅ Đang chạy (`supabase status` OK — API `127.0.0.1:54321`, DB `54322`) |
| Link remote | ✅ Đã link `ymtogeacpnlmthjlryrd` (name **Summer_activities**) — `supabase/.temp/linked-project.json` |
| Remote Postgres | 17.6 (pooler khả dụng) |

## B — Rà soát migration trước push (an toàn) ✅

`npx supabase migration list` (kết nối remote):

| Local | Remote | Migration |
| --- | --- | --- |
| 20260705010000 | 20260705010000 | core_schema (19 bảng) |
| 20260705010100 | 20260705010100 | rls_helpers |
| 20260705010200 | 20260705010200 | rls_policies (71 policy) |

- **Cả 3 migration đã áp trên remote** (local ↔ remote khớp hoàn toàn). User đã `db push`
  thành công trước đó → **không cần push lại**, và **không có gì mới để push**.
- Remote **chỉ có đúng 3 migration của dự án**, **không** có migration/bảng nghiệp vụ lạ
  ngoài dự án → an toàn, không phải dừng.
- **Không** chạy `db reset`/seed lên remote; **không** drop table; **không** disable RLS.

## C — TypeScript database types ✅

- Sinh lại từ remote đã link: `npx supabase gen types typescript --linked`.
- **Diff với `src/lib/database.types.ts` hiện có → IDENTICAL** (1004 dòng) ⇒ types phản ánh
  đúng schema remote, không stale.
- File: `src/lib/database.types.ts` (19 bảng + enums: `user_role, session_type,
  attendance_status, leave_status, notification_scope, import_source, import_status`).

## D — Nối types thật vào code ✅

| File | Thay đổi |
| --- | --- |
| `src/lib/types/index.ts` | Bỏ `interface Database {}` rỗng → `export type { Database, Json }` từ `@/lib/database.types`; thêm helper `Tables<>/TablesInsert<>/TablesUpdate<>/Enums<>` |
| `src/lib/supabase/client.ts` | `createBrowserClient<Database>(...)` |
| `src/lib/supabase/server.ts` | `createServerClient<Database>(...)` |
| `src/lib/supabase/proxy.ts` | `createServerClient<Database>(...)` |
| `src/app/api/health/route.ts` | `phase` cập nhật `1-scaffold` → `5-db-schema-rls` |
| `supabase/.gitignore` (mới) | ignore `.branches`, `.temp`, `.env` (CLI metadata/secret) |

## E — Kiểm tra `/api/health` ✅

| Môi trường | Kết quả |
| --- | --- |
| Local (`next start`) | `{"status":"ok","phase":"5-db-schema-rls","supabaseConfigured":true}` |
| Production (trước redeploy) | `{"status":"ok","phase":"1-scaffold","supabaseConfigured":true}` |
| Production (sau redeploy) | cập nhật `phase=5-db-schema-rls` sau khi push `main` build xong |

`supabaseConfigured: true` ở cả hai ⇒ env public (URL + publishable key) hoạt động đúng
(local từ `.env.local`, production từ Vercel env đã set ở 04C).

## F — Kiểm tra chất lượng ✅

| Bước | Kết quả |
| --- | --- |
| `npm run lint` | ✅ Pass |
| `npm run typecheck` | ✅ Pass (types thật biên dịch sạch) |
| `npm run build` | ✅ Pass |

## G — Ghi chú & việc còn lại

- `supabase/config.toml` `major_version = 15` (local) trong khi remote là 17 — chỉ ảnh hưởng
  **local dev**, không ảnh hưởng remote (đã push xong). Để đồng bộ hẳn có thể nâng lên 17 và
  `supabase stop && supabase start` ở prompt sau (tránh làm gián đoạn stack đang chạy ở prompt này).
- `SUPABASE_SERVICE_ROLE_KEY` **chưa** cấu hình trên Vercel (chưa cần ở phase này; chỉ dùng
  server-side khi làm CRUD/Auth phase sau). **Không** đưa vào client.
- Chưa làm Auth/CRUD/OCR/DOCX/Notification thật (đúng phạm vi).

## H — Tuân thủ quy tắc

- ✅ Không `db reset`/seed remote; không drop table; không disable RLS; không nới lỏng policy.
- ✅ Không commit `.env.local`/`.vercel/`/`.next/`/`node_modules`/secret/DB password (đã ignore).
- ✅ Không đưa service role vào client.
- ✅ Remote chỉ chứa migration dự án → không có dữ liệu lạ; không phải dừng khẩn.
- ✅ Không Auth/CRUD/OCR/DOCX/Notification thật.
