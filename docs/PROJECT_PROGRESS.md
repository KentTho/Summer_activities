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
| Phase 7 — CRUD thật | ✅ Done | 06A: CRUD học sinh (Bí thư); 08A: Admin CRUD tài khoản; **08B: CRUD Khu phố + phân công phụ trách có vai trò (chính/phối hợp)** |
| Phase 8 — Attendance workflow thật | ✅ Done | **07: tạo buổi, điểm danh (4 trạng thái), sửa/chốt buổi, xin nghỉ, dashboard thật** — qua RLS |
| Phase 9 — Import ảnh (AI) staging thật | ✅ Done (MVP) | 06A: staging + confirm; 06B: OCR.space (đã gỡ); **09B: Gemini Vision đọc ảnh → JSON → dòng nháp → duyệt tay → confirm**; lưu ảnh/audit để sau |
| Phase 10 — DOCX export thật | ✅ Done (MVP) | **08C: upload binary mẫu vào Storage private + render DOCX thật server-side** (DS học sinh, điểm danh buổi, tổng hợp hệ thống) qua bộ ghi ZIP/OOXML zero-dependency |
| Phase 11 — Notification thật | ✅ Done (MVP/core) | 08A: gửi theo buổi; **09H: tự gửi khi hủy/dời buổi, Admin gửi hệ thống/Khu phố, unread + mark-read (Phụ huynh), smoke 8/8** — qua RLS. Realtime + nav badge Bí thư/Admin còn backlog |
| Phase 12 — Vercel deploy + hardening | ✅ Done (MVP/core) | Deploy live (04A); **09H: service role production đã set + prod smoke 25/25, defensive 503, CI smoke + retention workflows, health phase sync (09I)**. Alert monitoring nâng cao còn backlog |

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
- [x] Đăng nhập bằng identifier (`identifierToEmail`): Admin="Admin", Bí thư=tài khoản được cấp
- [x] CRUD học sinh (Bí thư) qua RLS: thêm/sửa/xóa mềm/tìm/lọc (Khu phố·Trường·Trạng thái)
- [x] Dashboard Bí thư dữ liệu thật (HS trong phạm vi, buổi sắp tới, đơn nghỉ, tỉ lệ điểm danh)
- [x] Import staging DB thật: lô nháp + dòng nháp + **confirm mới tạo học sinh** (không auto-import)
- [x] Admin dashboard + Khu phố/Bí thư/Phân công đọc thật (chỉ đọc)
- [x] Bỏ banner DemoNotice cố định (nhiều trang đã dữ liệu thật)
- [x] Lint/typecheck/build pass; guard smoke (307) cho trang mới
- [x] Report 06A + cập nhật history/progress
- [ ] Chạy `npm run bootstrap:auth` (tạo Admin + Bí thư bằng env `BOOTSTRAP_*`, KP01, phân công)
      — **skip**: thiếu `SUPABASE_SERVICE_ROLE_KEY` trong `.env.local`

> Ghi chú: CRUD/import đi qua RLS (không service role ở UI). Chưa làm OCR AI/DOCX/Notification/
> Attendance workflow thật; full CRUD Admin để prompt sau.

### Prompt 06B — Bootstrap accounts (chạy thật) + OCR import + security/devops notes
- [x] Xác nhận DB sau reset: 2 auth users, KP01, 1 phân công, 0 học sinh (sạch)
- [x] **Bootstrap đã chạy** (service role key có sẵn): Admin + Bí thư bằng mật khẩu runtime
- [x] **Test login thật** cả 2 tài khoản → OK (ADMIN + SECRETARY, đúng role)
- [x] OCR server-side (`src/lib/ocr/*`): interface + adapter OCR.space + parser VN + factory
- [x] Server Action `ocrExtractRows` (upload ảnh/PDF → OCR → dòng nháp `reviewed=false`)
- [x] Kiểm tra/sửa tay: `EditableRow` + `updateRow` ("Lưu & duyệt" → `reviewed=true`)
- [x] Confirm **chỉ tạo học sinh từ dòng đã duyệt**; đóng lô khi hết dòng chờ
- [x] Validate file (mime whitelist + ≤1MB) + body Server Action 2MB; key OCR server-only
- [x] Move key OCR khỏi `.env.example` (bị commit) → `.env.local`; sửa `.env.example` placeholder
- [x] Docs: rewrite `ocr-import.md`; bổ sung `security.md` (session/JWT/AI); mới
      `devops-deploy-rollback-backup.md` + `ai-security-checklist.md`
- [x] Lint/typecheck/build pass; parser + OCR.space auth verify (script)
- [x] Report 06B + cập nhật history/progress

> Ghi chú: OCR **không lưu ảnh gốc** (OCR tại chỗ, chỉ giữ text đã duyệt) — lưu ảnh
> vào bucket private + audit để phase sau. Vẫn chưa làm Attendance/DOCX/Notification thật.

### Prompt 07 — Attendance workflow + Leave requests + engineering guardrails
- [x] Migration additive: `activity_sessions.closed_at` + sửa deadlock `snb_insert` (người tạo gắn Khu phố)
- [x] Migration additive: `sessions_select` thêm nhánh `created_by` (buổi mới select được)
- [x] Migration additive: helper `is_guardian_of_session` + phụ huynh xem buổi/Khu phố của con
- [x] Bí thư tạo buổi (thường/chung), danh sách buổi, chi tiết buổi
- [x] Điểm danh 4 trạng thái: PRESENT / EXCUSED / UNEXCUSED / NOT_MARKED (NOT_MARKED = xóa bản ghi)
- [x] Sửa điểm danh khi buổi mở; **chốt buổi** (khóa sửa) + mở lại
- [x] Phụ huynh gửi xin nghỉ (chỉ con liên kết — RLS is_guardian_of); Bí thư duyệt/từ chối
- [x] Duyệt đơn → gợi ý ghi điểm danh EXCUSED cho đúng buổi (nếu buổi còn mở)
- [x] Dashboard Bí thư: buổi hôm nay/sắp tới, số cần điểm danh, CM/CP/KP tháng, tỉ lệ tham gia
- [x] Cổng Phụ huynh dữ liệu thật: lịch sinh hoạt, đơn xin nghỉ, lịch sử điểm danh
- [x] Admin xem tổng quan buổi thật (read-only)
- [x] Docs guardrails: `engineering-guardrails.md` (4 nhóm ghi chú, chọn lọc)
- [x] Lint/typecheck/build pass; **smoke test RLS ký tên Bí thư + Phụ huynh thật** (tạo→sạch)
- [x] Report 07 + cập nhật history/progress

> Ghi chú: mọi thao tác đi qua **RLS** (không service role ở UI). Attendance/leave đã thật.
> Chưa làm: DOCX export, Notification thật (đúng phạm vi). Chưa có tài khoản Phụ huynh thật
> trên môi trường (flow đã verify bằng parent tạm trong smoke test rồi xóa) — liên kết
> guardian↔student do Bí thư/Admin làm ở phase sau.

### Prompt 08A — Admin Control Center + staff/parent accounts + session defaults + notifications
- [x] Migration additive: `profiles.staff_title`, `activity_sessions.canceled_at`
- [x] Migration corrective: sửa **đệ quy RLS** notifications ↔ notification_recipients (42P17) bằng helper SECURITY DEFINER
- [x] Tách public entry: trang `/` chỉ hiện cổng Người dùng; Admin tự vào `/admin` (bảo mật vẫn Auth/RBAC/RLS)
- [x] `staff_title` cho SECRETARY: **Bí thư / Chi Đoàn** (chung quyền, khác nhãn — không role mới)
- [x] Admin tạo tài khoản Bí thư/Chi Đoàn + Phụ huynh (service role CHỈ tạo auth user, sau requireAdmin)
- [x] Reset mật khẩu tạm (`must_change_password`, hiện 1 lần, không log); khóa/mở (deactivate, không hard-delete)
- [x] Gán/bỏ gán Bí thư ↔ Khu phố; liên kết Phụ huynh ↔ Học sinh (mở khóa cổng Phụ huynh)
- [x] Audit log **thật**: ghi thao tác Admin (append-only) + trang xem `/admin/audit`
- [x] Buổi: dừng/hủy (`canceled_at`) + khôi phục, dời ngày/giờ, buổi chung nhiều Khu phố (đã có)
- [x] Bí thư/Chi Đoàn gửi **thông báo cho phụ huynh** liên quan buổi (RLS); Phụ huynh/Bí thư notifications thật
- [x] Điểm danh: **tìm theo tên HS / SĐT phụ huynh** trên roster; đánh dấu nhanh (đã có)
- [x] Report templates foundation: Admin thêm/duyệt (bật/tắt) mẫu `.docx` (chặn `.docm`); Bí thư xem mẫu đang bật
- [x] Lint/typecheck/build pass; **smoke test RLS ký tên Admin + Bí thư + Phụ huynh thật** (tạo→sạch)
- [x] Report 08A + cập nhật history/progress

> Ghi chú: service role **chỉ** dùng tạo/reset auth user trong action đã `requireAdmin()`; mọi
> read/write còn lại qua RLS. DOCX render thật + upload binary để **Prompt 08B**.

### Prompt 08B — Tối ưu Admin + Vai trò phụ trách + Rà soát câu chữ
- [x] Migration additive `20260707030000_assignment_roles`: `secretary_neighborhoods.assignment_role`
      (`PRIMARY`/`COORDINATING`) + **partial unique index** (tối đa 1 Phụ trách chính/Khu phố)
- [x] `gen types --linked` thật (có token) → `database.types.ts` sinh lại, có `assignment_role`
- [x] Khu phố: danh sách thật kèm **số học sinh · cán bộ phụ trách · buổi sinh hoạt · Phụ trách chính · trạng thái**
- [x] Khu phố: thêm/sửa/ngừng-kích hoạt (`createNeighborhood`/`updateNeighborhood`/`setNeighborhoodActive`) — **không hard-delete**
- [x] Phân công: vai trò **Phụ trách chính** (≤1/Khu phố) & **Phụ trách chung/phối hợp** (nhiều); 1 cán bộ nhiều Khu phố
- [x] `assignNeighborhood(role)` + `setAssignmentRole` + `demoteExistingPrimary` (giữ ràng buộc 1 chính)
- [x] `/admin/assignments` viết lại theo góc nhìn Khu phố (chính + phối hợp + phân công/đổi vai trò/gỡ)
- [x] `/admin/secretaries` & `/admin/parents`: nhãn rõ + **tìm kiếm** (tên/SĐT qua RLS)
- [x] Rà soát câu chữ: bỏ số prompt nội bộ khỏi UI, thống nhất trạng thái/nhãn, giảm jargon
- [x] Lint/typecheck/build pass; **smoke test RLS ký tên Admin thật** (tạo→gán vai trò→đổi→dọn sạch)
- [x] Report 08B + cập nhật history/progress

> Ghi chú: mọi read/write 08B qua **RLS** (không service role). Ràng buộc "1 Phụ trách chính/Khu phố"
> enforce ở DB (partial unique index). Chưa làm: render DOCX thật + upload binary mẫu (prompt sau);
> `/admin/students`,`/admin/reports`,`/admin/settings` giữ mức đọc/tối giản.

### Prompt 08C — Audit ID + DOCX export thật + Hardening Admin + Health/sweep
- [x] Audit ID toàn DB: mọi bảng nghiệp vụ `id uuid default gen_random_uuid()` (đã tự sinh);
      `system_settings.id boolean` singleton có chủ đích; bảng liên kết có id + unique composite → **không sửa**
- [x] Bộ ghi DOCX **zero-dependency** (`src/lib/docx/`): ZIP STORE + CRC-32 + OOXML tối giản (render server-side)
- [x] Upload mẫu `.docx` thật → **Storage bucket private** `report-templates`; chặn `.docm`/macro (đuôi + mime + magic bytes + quét `vbaProject`); metadata vào `uploaded_documents` + `export_templates` (qua RLS)
- [x] Tải lại mẫu (Admin): route `admin/templates/[templateId]/download` (service role đọc binary sau xác thực ADMIN)
- [x] Export DOCX thật: **DS học sinh**, **điểm danh theo buổi** (Bí thư/Chi Đoàn), **tổng hợp hệ thống** (Admin) — RLS + audit `EXPORT_DOCX`
- [x] `/admin/students` đọc thật + tìm/lọc; `/admin/reports` số liệu thật + xuất DOCX; `/admin/settings` lưu thật (whitelist + audit)
- [x] `/api/health.phase` → `08c-docx-export-admin-hardening` (bỏ hardcode `5-db-schema-rls`)
- [x] Rà soát: hết trang mock/`DemoNotice`; nút "chưa kết nối/sắp có" thay bằng hành động thật
- [x] Lint/typecheck/build pass; **smoke test RLS ký tên Admin thật** (đọc HS/upsert settings/insert template → dọn sạch)
- [x] Report 08C (có mục **Gợi ý bước tiếp theo** bắt buộc) + cập nhật history/progress

> Ghi chú: mẫu upload là **tệp tham chiếu** (chưa có placeholder-merge); export dùng bộ sinh riêng —
> MVP chạy thật, không giả. Storage binary qua service role **chỉ sau `requireAdmin()`**; mọi metadata/read
> nghiệp vụ vẫn qua RLS. `src/lib/mock/*` nay không ai import (để dọn ở prompt sau).

### Prompt 09A — Production hardening + Operational playbook + DOCX placeholder merge
- [x] Audit 4 nhóm kiến thức (DevOps/Auth/SDLC/AI-Security) → tích hợp chọn lọc vào docs vận hành
- [x] Production Readiness Playbook + 4 checklist (`safe-deployment`, `auth-session-hardening`, `sdlc-debugging-test-plan`, `ai-code-security-gate`)
- [x] Preflight script `npm run preflight` (secret/ignored/mock/health — không in secret)
- [x] **Ép đổi mật khẩu lần đầu**: cờ `must_change_password` (auth metadata) → layout cổng redirect `/change-password`; đổi xong xóa cờ (`auth.updateUser`, không service role)
- [x] **DOCX placeholder-merge MVP**: đọc mẫu `.docx` upload (unzip zlib), thay `{{...}}`, re-zip; **fallback** DOCX tự sinh khi mẫu không có placeholder/hỏng
- [x] Dọn dead code `src/lib/mock/*` (đã xác nhận không còn import); typecheck xanh
- [x] Phân trang `/admin/students` (page/pageSize whitelist, giữ search/filter)
- [x] Docs OCR production (`ocr-production-setup.md`); không hardcode key
- [x] `/api/health.phase` → `09a-production-hardening` + cờ `databaseTypesReady/ocrConfigured/docxExportReady/passwordChangeReady`
- [x] `project-repair-backlog.md` (đã xử lý · còn lại · không làm ngay)
- [x] Lint/typecheck/build + preflight pass; **smoke đổi mật khẩu** (user throwaway: đổi + xóa cờ → dọn sạch); **self-test merge** trên docx DEFLATE thật
- [x] Report 09A (có **Gợi ý bước tiếp theo** + **Điểm cần tu sửa thêm** + **Không nên làm ngay**)

> Ghi chú: **Admin (`admin@...`) hiện có `must_change_password=true`** → sẽ bị ép đổi mật khẩu khi vào cổng
> lần tới (đúng thiết kế). Placeholder-merge là **MVP**: placeholder phải gọn trong 1 run, không hỗ trợ
> vòng lặp — mẫu không hợp lệ thì fallback DOCX tự sinh. Không build logout-all/token-version (chỉ backlog).

### Prompt 09B — Bỏ OCR.space + Gemini AI import + monitoring nhẹ
- [x] Gỡ **hoàn toàn** OCR.space: xóa `src/lib/ocr/*`, env `OCR_*`, UI copy "OCR", docs vận hành; không dead code
- [x] **Gemini Vision** server-side (`src/lib/ai-import/*`): `fetch` REST, JSON schema chặt (Zod), strip code fence
- [x] Chuẩn hóa: SĐT VN `+84→0`, ngày `d/m/y → YYYY-MM-DD`; thiếu field/độ tin cậy thấp → `needs_review`
- [x] Giữ **staging bắt buộc**: AI → dòng nháp `reviewed=false` → duyệt tay → confirm mới tạo `students` (không auto-import)
- [x] Thiếu key / `AI_IMPORT_ENABLED=false` / quota-timeout → thông báo thân thiện, **nhập tay vẫn chạy**
- [x] UI: "AI đọc ảnh (Gemini)", cảnh báo "AI có thể đọc sai — kiểm tra trước khi xác nhận", hiện confidence/needs_review
- [x] `/api/health` phase `09b-gemini-ai-import` + cờ `geminiConfigured/aiImportReady`; preflight quét `GEMINI_API_KEY`
- [x] Monitoring nhẹ `lib/monitoring/server-log.ts` (redact PII/key/base64) + audit `AI_IMPORT` (không PII)
- [x] Docs: `gemini-ai-import.md`, `ai-import-test-plan.md`; cập nhật security/checklist/playbook; retire `ocr-*`
- [x] preflight/lint/typecheck/build pass; **live smoke Gemini** (ảnh test → 3 dòng đúng, ngày/SĐT chuẩn hóa)
- [x] Report 09B (Gợi ý tiếp theo + Điểm cần tu sửa + Không nên làm ngay)

> Ghi chú: enum `import_batches.source` giữ giá trị `OCR` (= "AI đọc ảnh") để **không** đổi schema; nguồn
> thật ghi ở `import_batch_rows.raw_data.source="GEMINI"`. PDF **chưa hỗ trợ** (chặn, báo chụp ảnh). Gemini
> free tier có **quota** — lỗi 429 báo thử lại, nhập tay luôn sẵn sàng. Gemini **chỉ gọi server-side**, key
> không ra client/git, không log ảnh/PII.

### Prompt 09C — AI import hardening: enum AI + rate-limit + private image storage
- [x] Migration additive: `import_source` thêm `AI` (giữ `OCR` lịch sử); `uploaded_documents.import_batch_id`
- [x] Migration additive: bảng `ai_import_usage` (unique profile/ngày) + RLS đọc (chính chủ/Admin) + RPC atomic `consume_ai_import_quota` + `my_ai_import_usage_today`; `db push` + `gen types` OK
- [x] Gemini draft rows đánh `import_batches.source='AI'` (raw_data.source vẫn "GEMINI")
- [x] **Rate-limit** theo user/ngày (`AI_IMPORT_DAILY_LIMIT=50`): vượt → không gọi Gemini/không upload, báo thân thiện, nhập tay vẫn chạy
- [x] **Lưu ảnh gốc** bucket PRIVATE `ai-import-uploads` (path `profileId/date/batchId/uuid.ext`) + `uploaded_documents` (sha256/size/import_batch_id) qua RLS; service role chỉ cho Storage sau xác thực
- [x] Flow: rate-limit → upload ảnh → uploaded_documents → Gemini → dòng nháp reviewed=false → audit `AI_IMPORT` (mã lô/ảnh, không PII). Gemini fail sau upload ⇒ ảnh vẫn còn để đối chiếu
- [x] UI: hiện lượt AI còn lại hôm nay, mục "Ảnh gốc đã lưu (riêng tư)" (không link công khai), copy giới hạn
- [x] Health phase `09c-ai-import-hardening` + cờ `aiImportRateLimitReady/aiImportStorageReady`; monitoring `ai_import_rate_limited/uploaded/failed/ok` (redact PII/path/key)
- [x] Docs `storage-policy.md` + cập nhật gemini-ai-import/test-plan/backlog
- [x] preflight/lint/typecheck/build pass; **smoke ký tên Admin thật**: rate-limit (allow×2→block), RLS đọc lượt, bucket private upload/remove → dọn sạch
- [x] Report 09C (Gợi ý tiếp theo + Điểm cần tu sửa + Không nên làm ngay)

> Ghi chú: rate-limit ghi **atomic** ở DB (RPC WHERE count < limit), không service role cho usage. Ảnh gốc
> **private**, không public URL; xem lại ảnh trên UI (route tải) để backlog. Vẫn **không auto-import**, PDF
> vẫn chặn. Gemini free tier có quota.

### Prompt 10A — Rà soát cấu trúc dự án + Chuẩn hóa Folder Architecture Docs (REVIEW + DOCS)
- [x] Read project tree
- [x] Audit current structure
- [x] Evaluate market readiness
- [x] Create folder architecture standard
- [x] Create refactor backlog
- [x] Update progress/history
- [x] Create report
- [x] No code changed

> Ghi chú: task **chỉ review + tài liệu**, KHÔNG sửa code nghiệp vụ (không đụng `src/`, `supabase/`,
> config, secret, remote, deploy). Phát hiện chính: business logic + data-access thật nằm ở `src/lib/`
> (đặc biệt `src/lib/data/*`), còn `src/modules/*` phần lớn là **skeleton rỗng** (`export {}`) — lệch
> với `architecture.md`; `README.md` còn ghi sai trạng thái "Phase 1 — Scaffold" (thực tế tới 09C).
> Kết luận: **đủ nền triển khai thực tế quy mô pilot/nhỏ**, không cần refactor lớn ngay; ưu tiên sửa
> docs (Phase 1 backlog) rồi chốt kiến trúc `src/modules/`. Tài liệu: `project-structure-audit.md`,
> `folder-architecture-standard.md`, `project-structure-refactor-backlog.md`, report 10A.

### Prompt 09G — Admin UI E2E + Secretary assignment + HTTP cookie image smoke
- [x] Script **E2E đăng nhập Admin** (`e2e-admin-login-smoke.mjs`): sai mật khẩu → lỗi; đúng → có
      session + JWT hợp lệ (`getUser`); hồ sơ ADMIN/active; (tùy chọn `E2E_BASE_URL`) `/admin` không
      cookie → redirect login. Tài khoản **disposable** `SMOKE_09G_` (không đụng Admin gốc), cleanup.
- [x] Script **gán Khu phố cho Bí thư** (`assign-secretaries-neighborhoods.mjs`): **mặc định DRY-RUN**
      (liệt kê Bí thư + "CHƯA PHÂN CÔNG" + hướng dẫn Admin); chỉ ghi khi `ASSIGN_SECRETARIES_JSON` +
      `ASSIGN_SECRETARIES_APPLY=true` → gán đúng chỉ định + audit `ASSIGN_NEIGHBORHOOD`, giữ ràng buộc 1 chính.
- [x] Script **E2E quên mật khẩu** (`e2e-password-request-smoke.mjs`): anon gọi RPC (trung lập); anon
      KHÔNG đọc bảng (RLS); Admin thấy PENDING + `matched_profile_id` đúng; resolve → RESOLVED; đăng nhập
      mật khẩu tạm được; audit `RESOLVE_PASSWORD_RESET_REQUEST` **không PII/mật khẩu**. Cleanup (audit giữ lại).
- [x] Script **E2E route ảnh qua HTTP + cookie thật** (`e2e-ai-image-route-http-smoke.mjs`): dựng cookie
      `sb-<ref>-auth-token` đúng format `@supabase/ssr` v0.12; gọi route thật từng vai trò.
- [x] **Header assertions** trong script HTTP: inline `Content-Type: image/png`, `Content-Disposition: inline`,
      download `attachment`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`; không rò bucket/path.
- [x] **Audit view/download** trong script HTTP: `VIEW_AI_IMPORT_IMAGE`/`DOWNLOAD_AI_IMPORT_IMAGE` đúng actor,
      detail không bucket/path/PII.
- [x] **Cleanup fixtures**: mọi script xóa users/KP/lô/ảnh/`SMOKE_09G_`; audit append-only **giữ lại** (ghi rõ).
- [x] **Health phase** → `09g-e2e-image-admin-assignment` + cờ `adminUiE2eReady`/`passwordRequestE2eReady`/
      `aiImageHttpSmokeReady`/`secretaryAssignmentReady` (giữ cờ cũ).
- [x] node --check 4 script + preflight/lint/typecheck/build pass.
- [x] Report 09G + Codex review prompt.
- [x] **RUNTIME smoke ĐÃ CHẠY THẬT** (có `.env.local`): `smoke:admin-login` **4/4**, `smoke:password-request`
      **8/8**, `smoke:ai-image-http` **local 19/19** trước Codex review hardening; script hiện thêm fail-fast
      `E2E_BASE_URL` + header leak asserts (rerun kỳ vọng **25/25**). Cleanup sạch.
- [x] ✅ **(Đã gỡ ở 09H)** `SUPABASE_SERVICE_ROLE_KEY` đã set trên Vercel Production + redeploy → prod smoke
      **25/25** (ADMIN/SEC-in 200). Route cũng hardened 503 thân thiện khi thiếu key. **Lưu ý: rotate key nếu từng lộ.**
- [ ] **Gán Khu phố thật cho 2 Bí thư mới** — chờ **Admin chỉ định** Khu phố (dry-run đã sẵn, không tự gán bừa).

> Ghi chú: đúng phạm vi 09G — không đổi RLS/schema, không reset DB, không public bucket, không UI polish.
> Runtime cần secret `.env.local` (bị gitignore, không mở trong sandbox) → smoke chạy khi vận hành. Cookie
> HTTP dựng khớp `@supabase/ssr` (đã đối chiếu `node_modules`: `sb-<ref>-auth-token`, `base64-`+base64url,
> chunk `.0/.1` khi > 3180). Audit append-only theo policy → dòng smoke `SMOKE_09G_` giữ lại (đã ghi rõ).

### Prompt 09H — Production service role closure + Defensive hardening + CI smoke + Retention + Notifications
- [x] **Vercel service role env checked**: `vercel env ls` xác nhận `SUPABASE_SERVICE_ROLE_KEY` có trên
      Production + Preview (không in giá trị). Blocker 09G **đã gỡ**.
- [x] **AI image route defensive 503**: thiếu service role/admin client lỗi → **503 thân thiện** + log
      `ai_image_storage_not_configured`/`ai_image_storage_error` (không PII/path), **không 500 trần**.
- [x] **Local smoke rerun**: `smoke:ai-image-http` **25/25**; `smoke:notification` **8/8**.
- [x] **Production smoke rerun**: sau redeploy → **25/25** (ADMIN/SECRETARY **200**, health `serviceRoleConfigured:true`).
- [x] **CI smoke workflow** `e2e-smoke.yml` (Repository Secrets, fail-fast, không lộ secret).
- [x] **Retention workflow** `ai-import-retention.yml` (dry-run mặc định; apply chỉ khi `vars.AI_IMPORT_RETENTION_APPLY`).
- [x] **Notification cancel/reschedule auto-send** (best-effort + audit `NOTIFY_SESSION_PARENTS`).
- [x] **Admin system notification** `/admin/notifications` (SYSTEM/NEIGHBORHOOD, audit `SEND_SYSTEM_NOTIFICATION`).
- [x] **Unread count / mark read** (Phụ huynh) + helper `countMyUnreadNotifications`/`mark*` qua RLS nr_update.
- [x] **README/architecture docs sync** (README 09H + env production; `folder-architecture-standard`; mới
      `notification-system.md`, `production-env-checklist.md`).
- [x] **Health phase** `09h-prod-hardening-ci-notifications` + cờ `serviceRoleConfigured`/`notificationCoreReady`/
      `retentionWorkflowReady`/`ciSmokeReady`.
- [x] **Deploy production + verify** (health 09h, endpoints 200) + Report 09H + Codex prompt.
- [ ] Nav badge unread cho Secretary/Admin + realtime subscription (backlog — hiện near-real-time).

> Ghi chú: **không** đổi RLS/schema (cột `read_at` đã có), không migration, không public bucket, không
> refactor `src/modules/*`. Notification qua RLS + helper SECURITY DEFINER (không đệ quy 42P17). Service
> role chỉ ở route/script server. Blocker service role production **đóng hoàn toàn** (prod smoke 25/25).

### Prompt 09I — CI healthcheck hotfix + Notification status sync
- [x] **Chẩn đoán**: GitHub `healthcheck.yml` chạy bản **committed** của `check-production-health.mjs`
      có `EXPECT_PHASE=09f-…` (thay đổi 09h nằm ở working tree **chưa commit** từ 09G/09H) → mismatch với
      production `09h-…` → job fail. Source app luôn đúng (health route = 09h).
- [x] **Fix healthcheck script**: default `09h-prod-hardening-ci-notifications` + override `EXPECT_PHASE` env;
      output in URL + phase thực tế + phase mong đợi; exit 1 khi unreachable/JSON lỗi/mismatch. **Không** hardcode 09F.
- [x] **Preflight OLD_PHASES**: gồm 09f/09g (stale), **không** gồm 09h → commit bản đúng.
- [x] **Progress sync**: Phase 11 Notification + Phase 12 Deploy → ✅ Done (MVP/core); rủi ro service role
      production → **đã gỡ**; notification smoke **8/8**.
- [x] **healthcheck local rerun** với production → PASS (phase 09h).
- [ ] Nav badge unread Bí thư/Admin + realtime (backlog — near-real-time hiện tại).

> Ghi chú: 09I chỉ sửa **scripts/workflows/docs** (không đổi runtime app) → **không cần redeploy**. Nguyên nhân
> gốc là file đúng nằm ở working tree chưa commit; hotfix = commit bản đúng + thêm `EXPECT_PHASE` override
> chống tái diễn. GitHub healthcheck xanh lại sau khi push (rerun trên commit mới).

## 4. Next planned prompts
1. Prompt 06B — Full CRUD Admin (Khu phố/Bí thư/Phân công) + tạo tài khoản Phụ huynh
2. Prompt 07 — Attendance + leave request thật
3. Prompt 08 — Import/OCR staging thật
4. Prompt 09 — DOCX export thật
5. Prompt 10 — Notification thật + deploy Vercel

## 5. Rủi ro đang mở
- ✅ (Đã gỡ) Bootstrap đã chạy: 2 tài khoản Admin/Bí thư đăng nhập được; service role key có sẵn.
  **09A: đã làm UI ép đổi mật khẩu lần đầu** — tài khoản có `must_change_password=true` bị chặn ở
  `/change-password` cho tới khi đổi. Admin hiện còn cờ true → sẽ đổi khi vào cổng lần tới.
- ✅ (Đã gỡ) Notifications (Bí thư + Phụ huynh) và reports Bí thư nay là **DB thật** (08A).
  Toàn bộ trang nghiệp vụ chính đã dùng DB thật. **08B: `/admin/neighborhoods` (CRUD + số liệu) và
  `/admin/assignments` (vai trò phụ trách) nay là DB thật đầy đủ.** Còn `/admin/students`,`/admin/reports`,
  `/admin/settings` vẫn đọc/tối giản (không thuộc scope 08B cốt lõi).
- ✅ (Đã gỡ) Admin có thể **tạo tài khoản Phụ huynh + liên kết guardian↔student** (08A) → mở khóa cổng Phụ huynh.
- **Đã sửa bug RLS đệ quy** notifications ↔ notification_recipients (42P17) bằng helper SECURITY DEFINER
  (migration 20260707020000). Rút kinh nghiệm: policy tham chiếu chéo 2 bảng phải dùng security-definer.
- Import ảnh (AI) phải qua staging review, không auto-import (đã enforce: confirm chỉ tạo từ dòng đã duyệt).
- **09B: chuyển sang Gemini Vision.** Production cần `GEMINI_API_KEY` (server-only, không `NEXT_PUBLIC_`)
  trên Vercel để bật AI; thiếu → nút AI tắt, **nhập tay vẫn chạy**. Gemini free tier có **quota** (429 → thử lại).
- ✅ (Đã gỡ) **09C** lưu ảnh gốc private; **09D** thêm route xem/tải ảnh (xác thực + audit
  `VIEW/DOWNLOAD_AI_IMPORT_IMAGE`), nút "Xem ảnh gốc" (không lộ path), retention dry-run
  (`cleanup:ai-import-images`), monitoring `healthcheck` + workflow, `raw_data.source="AI"`.
  Độ chính xác AI là best-effort (bước duyệt tay bù lại). **PDF chưa hỗ trợ.**
- **09E**: luồng **Quên mật khẩu** → Admin cấp mật khẩu tạm (bảng `password_reset_requests`, RLS chỉ Admin,
  RPC trung lập chống spam; audit `RESOLVE/REJECT_PASSWORD_RESET_REQUEST`; alert PENDING ở dashboard). Thêm
  UUID validate route ảnh; 2 tài khoản Bí thư mới (must_change_password, **chưa phân
  công** — Admin cần gán Khu phố + đặt lại mật khẩu tạm); Gemini dry-run 3 ảnh (report PII **gitignored**).
  ⚠️ Smoke xem ảnh bằng session thật cho từng vai trò **chưa chạy** (chưa có dữ liệu ảnh AI trong DB).
- **09F**: **Admin gốc khỏe mạnh** (role ADMIN/active/`must_change_password=false`) → không vào được = **sai
  mật khẩu**, không phải lỗi hệ thống. Thêm **break-glass** `recover:admin` (đặt lại mật khẩu qua env, không
  hardcode/không in); bỏ link "Quên mật khẩu?" ở `/admin/login` (chỉ dẫn khôi phục máy chủ); giữ
  `/forgot-password` cho Bí thư/Phụ huynh. **Smoke session thật**: đăng nhập Admin + ép đổi mật khẩu (6/6);
  gate phân quyền ảnh 4 vai trò (8/8, fixtures `SMOKE_09F_`, đã cleanup). 2 Bí thư mới **vẫn chưa phân
  công** — cần Admin gán Khu phố.
- ✅ (Đã gỡ) DOCX export **render server-side + log audit** (08C): bộ ghi ZIP/OOXML zero-dependency;
  mẫu `.docx` lưu Storage **private** (chặn `.docm`/macro). Còn lại: **placeholder-merge** vào mẫu upload
  (hiện export dùng bộ sinh riêng, mẫu chỉ là tệp tham chiếu) — làm khi cần khớp mẫu in chính xác.
- Storage bucket `report-templates` là **private**: tải mẫu/tệp báo cáo chỉ qua route server (attachment),
  **không** public URL. Service role chỉ chạm binary sau `requireAdmin()`.
