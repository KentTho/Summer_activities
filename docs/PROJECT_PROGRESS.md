# PROJECT PROGRESS — Web-App Điểm danh sinh hoạt hè

## 1. Nguyên tắc cập nhật
- Sau mỗi prompt hoàn thành, phải tick checklist tương ứng.
- Mỗi prompt phải tạo report riêng trong `docs/reports/`.
- Không tick hạng mục nếu chỉ mới UI demo mà chưa có logic thật.
- Nếu một phần chỉ là UI shell, ghi rõ là "UI shell", không ghi là đã hoàn thành nghiệp vụ thật.

## 2. Tổng quan trạng thái

| Phase | Trạng thái | Ghi chú |
|---|---|---|
| Phase 1 — Scaffold | ✅ Done | Next.js + Supabase shell |
| Phase 2 — Route split + UI shell | ✅ Done | Admin/User portal split |
| Phase 3 — User portal UI pages | ✅ Done (UI shell + mock) | Prompt 03C — chưa nối DB thật |
| Phase 4 — Admin management UI pages | ✅ Done (UI shell + mock) | Prompt 03D — chưa nối DB thật |
| Phase 5 — Supabase schema + RLS | ✅ Done | Migrations áp remote (04D), RLS bật, types thật sinh + nối vào code |
| Phase 6 — Auth thật + RBAC guard | ✅ Done | Prompt 05 — Supabase Auth, guard 2 lớp, redirect vai trò, logout |
| Phase 7 — CRUD thật | 🟡 In progress | 06A: CRUD học sinh (Bí thư) qua RLS + Admin đọc thật; CRUD Admin đầy đủ để sau |
| Phase 8 — Attendance workflow thật | ⬜ Pending | Chưa làm (06A chỉ đọc tỉ lệ cho dashboard) |
| Phase 9 — Import/OCR staging thật | 🟡 In progress | 06A: import staging DB thật + confirm; OCR AI để sau |
| Phase 10 — DOCX export thật | ⬜ Pending | Chưa làm |
| Phase 11 — Notification thật | ⬜ Pending | Chưa làm |
| Phase 12 — Vercel deploy + hardening | 🟡 In progress | Deploy production live, đã sửa 404 (04A); hardening sau |

## 3. Checklist chi tiết

### Prompt 03A — Review + GitHub + Supabase config
- [x] Review scaffold
- [x] Local run
- [x] GitHub push lần đầu
- [x] Supabase env/config mẫu
- [x] Report 03A

### Prompt 03B — Split Admin/User + UI shell + docs
- [x] Tách route Admin/User
- [x] Nâng shell UI
- [x] Auth strategy doc
- [x] OCR/import doc
- [x] DOCX export doc
- [x] Report 03B
- [x] Commit/push 03B (gộp cùng 03C)

### Prompt 03C — User portal pages
- [x] Secretary dashboard nâng cấp
- [x] Secretary sessions page
- [x] Secretary attendance page
- [x] Secretary students page
- [x] Secretary leave requests page
- [x] Secretary import page
- [x] Secretary reports page
- [x] Secretary notifications page
- [x] Parent dashboard nâng cấp
- [x] Parent schedule page
- [x] Parent leave request page
- [x] Parent notifications page
- [x] Parent attendance history page
- [x] Mock data tách riêng (`src/lib/mock/`)
- [x] Report 03C
- [x] Lint/typecheck/build pass
- [x] Commit/push 03C

> Ghi chú: toàn bộ trang 03C là **UI shell + mock data** (nhãn "UI demo" trên mỗi
> trang). Chưa có nghiệp vụ thật — không tick mục CRUD/attendance/DB ở các phase sau.

### Prompt 03D — Admin management pages
- [x] Admin dashboard nâng cấp (KPI + cảnh báo phân công + audit gần đây)
- [x] Quản lý Khu phố (`/admin/neighborhoods`)
- [x] Quản lý Bí thư (`/admin/secretaries`)
- [x] Gán Bí thư ↔ Khu phố (`/admin/assignments`)
- [x] Tổng quan học sinh hệ thống (`/admin/students`)
- [x] Tổng quan buổi sinh hoạt hệ thống (`/admin/sessions`)
- [x] Quản lý mẫu báo cáo DOCX (`/admin/templates`)
- [x] Báo cáo tổng hợp hệ thống (`/admin/reports`)
- [x] Audit log (`/admin/audit`)
- [x] Cấu hình hệ thống an toàn (`/admin/settings`)
- [x] Mock data Admin tách riêng (`src/lib/mock/admin.ts`)
- [x] Nav Admin cập nhật
- [x] `docs/admin-management-pages.md`
- [x] Report 03D
- [x] Lint/typecheck/build pass
- [x] Commit/push 03D

> Ghi chú: toàn bộ trang 03D là **UI shell + mock data** (nhãn "UI demo"). Chưa
> có Auth/DB/CRUD/DOCX thật.

### Prompt 04A — Fix Vercel 404 + deployment verification
- [x] Chẩn đoán 404 (framework preset = null → không chạy builder Next.js)
- [x] Thêm `vercel.json` khai báo `framework: nextjs` (fix có version control)
- [x] Build local pass
- [x] Redeploy production + verify mọi route 200 (`summer-activities-theta.vercel.app`)
- [x] Report 04A
- [x] Commit/push

> Deploy production đã hoạt động. Chưa cấu hình Supabase env trên Vercel (phase sau).

### Prompt 04B — Supabase schema + RLS + seed + policy check
- [x] Core schema migration (19 bảng, enums, index, trigger, grants)
- [x] RLS helper functions (security definer, RBAC theo Khu phố/buổi)
- [x] Bật RLS deny-by-default + 71 policy theo vai trò
- [x] Seed local/dev (dữ liệu giả, không auth, không production)
- [x] RLS smoke test (`supabase/tests/rls_smoke.sql`)
- [x] `config.toml` bật `[db.seed]`; cập nhật `supabase/README.md` + `data-model.md`
- [x] Report 04B
- [x] Lint/typecheck/build pass
- [x] Commit/push
- [ ] `supabase db push` remote — **chờ bạn `link` project ref** (xem report 04B §J)
- [ ] `supabase gen types` — chờ có DB local/remote

> Ghi chú: schema/RLS **mới ở dạng file migration**, **chưa** áp lên Supabase thật.
> Chưa làm Auth/CRUD/OCR/DOCX thật.

### Prompt 04C — Connect Supabase remote + env naming + Vercel env
- [x] Đổi env naming: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (giữ backward-compat `..._ANON_KEY`)
- [x] Cập nhật `env.ts` + `client.ts` / `server.ts` / `proxy.ts` dùng publishable key
- [x] Cập nhật `.env.example`, `ci.yml`, `supabase/README.md`, `docs/security.md`
- [x] `config.toml.project_id` → project ref thật (`ymtogeacpnlmthjlryrd`)
- [x] Đẩy public env (URL + publishable key) lên Vercel (production/preview/development)
- [x] Rà soát tĩnh migration 04B: 19 bảng, 71 policy, không drop/disable RLS → an toàn push
- [x] Lint/typecheck/build pass
- [x] Report 04C
- [ ] `supabase link` + `supabase db push` remote — **chờ bạn cài CLI + login + DB password**
- [ ] `supabase gen types` → `src/lib/database.types.ts` — chờ CLI + login

> Ghi chú: Supabase CLI chưa cài + chưa login + không có DB password → các bước chạm DB
> remote **hoãn**; xem hướng dẫn ở report 04C §F. `SUPABASE_SERVICE_ROLE_KEY` **chưa** cấu hình
> (chưa có giá trị đầy đủ).

### Prompt 04D — Finalize Supabase apply + types + deploy check
- [x] Xác nhận link remote đúng `ymtogeacpnlmthjlryrd` (`.temp/linked-project.json`)
- [x] `supabase migration list`: cả 3 migration đã áp remote (local ↔ remote khớp)
- [x] Remote chỉ chứa migration dự án (không bảng/dữ liệu lạ) → an toàn, không cần push lại
- [x] `gen types --linked` → `src/lib/database.types.ts` (diff IDENTICAL với file có sẵn)
- [x] Nối types thật: `types/index.ts` re-export `Database` + helper; client/server/proxy `createClient<Database>`
- [x] `supabase/.gitignore` (ignore `.branches`/`.temp`/`.env`)
- [x] `/api/health` local + production `supabaseConfigured: true`; phase → `5-db-schema-rls`
- [x] Lint/typecheck/build pass
- [x] Report 04D
- [x] Commit/push + redeploy Vercel

> Ghi chú: `config.toml.major_version=15` (local) vs remote 17 — chỉ ảnh hưởng local dev.
> `SUPABASE_SERVICE_ROLE_KEY` chưa set (chỉ cần khi CRUD/Auth phase sau, server-side).
> Vẫn **chưa** làm Auth/CRUD/OCR/DOCX/Notification thật.

### Prompt 05 — Auth thật + RBAC guard + role redirect
- [x] Server Actions login (`signInAdmin`/`signInUser`) + `signOut` (Supabase Auth)
- [x] `getCurrentProfile()` thật (`auth.getUser()` → `profiles`)
- [x] Guard middleware `proxy.ts`: chưa đăng nhập + route bảo vệ → login đúng cổng (test 307)
- [x] Guard layout theo vai trò: sai vai trò → `ROLE_HOME` (Parent/Secretary/Admin cách ly)
- [x] Redirect vai trò: ADMIN→/admin, SECRETARY→/user/secretary, PARENT→/user/parent
- [x] Login form thật (`useActionState`, lỗi + pending); logout form (Server Action)
- [x] Admin client server-only (`lib/supabase/admin.ts`, service role) — không ra client
- [x] Script bootstrap demo users (`npm run bootstrap:auth`) — idempotent, gated service role
- [x] `docs/IMPLEMENTATION_HISTORY.md` + cập nhật `auth-strategy.md`
- [x] Lint/typecheck/build pass
- [x] Report 05
- [ ] Chạy bootstrap demo users — **skip**: thiếu `SUPABASE_SERVICE_ROLE_KEY` trong `.env.local`

> Ghi chú: Chưa có users → chưa test đăng nhập end-to-end; guard "chưa đăng nhập" đã test (307).

### Prompt 06A — Bootstrap accounts + Secretary CRUD + dashboard + import staging
- [x] Migration additive `students` (birth_date/school/guardian_name/guardian_phone) → push remote + gen types
- [x] Đăng nhập bằng identifier (`identifierToEmail`): Admin="Admin", Bí thư="0932077136"
- [x] CRUD học sinh (Bí thư) qua RLS: thêm/sửa/xóa mềm/tìm/lọc (Khu phố·Trường·Trạng thái)
- [x] Dashboard Bí thư dữ liệu thật (HS trong phạm vi, buổi sắp tới, đơn nghỉ, tỉ lệ điểm danh)
- [x] Import staging DB thật: lô nháp + dòng nháp + **confirm mới tạo học sinh** (không auto-import)
- [x] Admin dashboard + Khu phố/Bí thư/Phân công đọc thật (chỉ đọc)
- [x] Bỏ banner DemoNotice cố định (nhiều trang đã dữ liệu thật)
- [x] Lint/typecheck/build pass; guard smoke (307) cho trang mới
- [x] Report 06A + cập nhật history/progress
- [ ] Chạy `npm run bootstrap:auth` (tạo Admin/`admin@123`, `0932077136`/`tho@123`, KP01, phân công)
      — **skip**: thiếu `SUPABASE_SERVICE_ROLE_KEY` trong `.env.local`

> Ghi chú: CRUD/import đi qua RLS (không service role ở UI). Chưa làm OCR AI/DOCX/Notification/
> Attendance workflow thật; full CRUD Admin để prompt sau.

## 4. Next planned prompts
1. Prompt 06B — Full CRUD Admin (Khu phố/Bí thư/Phân công) + tạo tài khoản Phụ huynh
2. Prompt 07 — Attendance + leave request thật
3. Prompt 08 — Import/OCR staging thật
4. Prompt 09 — DOCX export thật
5. Prompt 10 — Notification thật + deploy Vercel

## 5. Rủi ro đang mở
- **Chưa có users** (thiếu `SUPABASE_SERVICE_ROLE_KEY`) → chưa chạy bootstrap, chưa test
  đăng nhập/CRUD/import end-to-end trên môi trường. Cần thêm key rồi `npm run bootstrap:auth`.
- Một số trang còn **mock data** (attendance/notifications/reports Bí thư, cổng Phụ huynh);
  Bí thư students/import/dashboard và Admin dashboard/list đã dùng **DB thật**.
- OCR/import phải qua staging review, không được auto-import thẳng (đã enforce: confirm mới tạo HS).
- DOCX export phải render server-side và log audit khi làm thật.