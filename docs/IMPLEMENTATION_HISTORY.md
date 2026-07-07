# LỊCH SỬ TRIỂN KHAI — Web-App Điểm danh sinh hoạt hè

> Nhật ký "đã làm gì" theo từng prompt để lần sau đọc lại biết việc nào đã xử lý,
> tránh làm trùng. Chi tiết đầy đủ ở `docs/reports/`. Checklist ở `docs/PROJECT_PROGRESS.md`.

| Prompt | Chủ đề | Kết quả cốt lõi | Report |
| --- | --- | --- | --- |
| 03A | Scaffold + GitHub + Supabase config mẫu | Next.js App Router shell, module skeleton | `PROMPT-03A-report.md` |
| 03B | Tách cổng Admin/User + UI shell | 2 cổng login, DashboardShell/AuthShell, docs auth | `PROMPT-03B-report.md` |
| 03C | User portal pages (mock) | Trang Bí thư + Phụ huynh (UI shell + mock) | `PROMPT-03C-...report.md` |
| 03D | Admin management pages (mock) | Trang Admin (UI shell + mock) | `PROMPT-03D-...report.md` |
| 04A | Fix Vercel 404 | `vercel.json` khai báo framework nextjs | `PROMPT-04A-...report.md` |
| 04B | Supabase schema + RLS + seed | 19 bảng, 71 policy, seed local, smoke test (file migration) | `PROMPT-04B-...report.md` |
| 04C | Env publishable key + Vercel env | Đổi tên env (backward-compat), set public env Vercel | `PROMPT-04C-...report.md` |
| 04D | Apply remote + types thật | Xác nhận migrations áp remote, gen types `--linked`, nối vào adapters | `PROMPT-04D-...report.md` |
| 05 | **Auth thật + RBAC guard + logout** | Login/logout Supabase Auth, guard theo `profiles.role`, redirect theo vai trò, admin client server-only, script bootstrap demo | `PROMPT-05-...report.md` |
| 06A | **Secretary CRUD + dashboard thật + import staging + login identifier** | Migration additive (birth_date/school/guardian), CRUD học sinh qua RLS, dashboard/admin dữ liệu thật, import staging (confirm mới tạo HS), đăng nhập bằng identifier; bootstrap tài khoản thật (chưa chạy — thiếu service role key) | `PROMPT-06A-...report.md` |
| 06B | **Bootstrap chạy thật + OCR import (server-side) + security/devops notes** | Xác nhận 2 tài khoản đăng nhập OK; OCR.space server-side → dòng nháp chưa duyệt → sửa/duyệt tay → confirm mới tạo HS; validate file + key server-only; move key khỏi `.env.example`; docs session/JWT + devops rollback/backup + AI security | `PROMPT-06B-...report.md` |
| 07 | **Attendance workflow + Leave requests thật + guardrails** | 3 migration additive (closed_at, snb_insert creator, guardian session visibility); tạo buổi/điểm danh 4 trạng thái/chốt buổi; phụ huynh xin nghỉ + Bí thư duyệt→EXCUSED; dashboard Bí thư/Phụ huynh + admin sessions thật; smoke test RLS ký tên thật; `engineering-guardrails.md` | `PROMPT-07-...report.md` |
| 08A | **Admin Control Center + tài khoản staff/phụ huynh + session defaults + notifications** | 2 migration additive (staff_title, canceled_at) + 1 corrective (fix đệ quy RLS notifications); Admin tạo/reset/khóa tài khoản (service role chỉ cho auth user sau requireAdmin) + gán Khu phố + liên kết phụ huynh↔HS; audit log thật; hủy/dời buổi + gửi thông báo phụ huynh; roster search; templates foundation; tách cổng public; smoke test Admin+Bí thư+Phụ huynh | `PROMPT-08A-...report.md` |

## Chi tiết Prompt 05 (Auth thật)

**Đã làm:**
- `signInWithPassword` qua Server Action (`src/lib/auth/actions.ts`): `signInAdmin`, `signInUser`, `signOut`.
- Kiểm tra vai trò khớp cổng: Admin chỉ vào cổng Admin; SECRETARY/PARENT chỉ vào cổng Người dùng.
- `getCurrentProfile()` thật (`src/lib/auth/session.ts`): `auth.getUser()` → map `profiles` (role, full_name, active).
- Guard 2 lớp:
  - **Middleware** (`src/proxy.ts`): route bảo vệ + chưa đăng nhập → redirect login đúng cổng.
  - **Server layout** (admin/portal, user/secretary, user/parent): sai vai trò → redirect về `ROLE_HOME` của vai trò.
- Redirect theo vai trò: ADMIN → `/admin`, SECRETARY → `/user/secretary`, PARENT → `/user/parent`.
- Logout thật: form + Server Action `signOut` trong `DashboardShell`.
- Login form thật (`LoginForm`): client component + `useActionState`, hiện lỗi + trạng thái pending.
- Admin client **server-only** (`src/lib/supabase/admin.ts`, service role, guard runtime chặn client).
- Script bootstrap demo users (`scripts/bootstrap-auth-users.mjs`, `npm run bootstrap:auth`) — idempotent, gated bởi service role key.

**Chưa làm (đúng phạm vi):** CRUD thật, Attendance thật, OCR/DOCX/Notification thật, nâng cấp UI lớn.

**Ghi chú vận hành:**
- `SUPABASE_SERVICE_ROLE_KEY` **chưa** cấu hình ở `.env.local` → **chưa** chạy bootstrap demo users;
  do đó chưa có tài khoản thật để đăng nhập end-to-end. Guard "chưa đăng nhập → login" đã test (307).
  Redirect chéo cổng theo vai trò đã kiểm tra qua code (cần demo users để test trực tiếp).
- Định danh phụ huynh hiện dùng **email + mật khẩu** (phương án mã tài khoản/SĐT để phase sau).

## Chi tiết Prompt 06A (Secretary CRUD + import + dashboard thật)

**Đã làm:**
- Migration additive `students`: `birth_date, school, guardian_name, guardian_phone` (+ index) — đã push remote + gen types.
- Đăng nhập bằng **identifier** (`identifierToEmail`): Admin nhập "Admin", Bí thư nhập "0932077136".
- CRUD học sinh cho Bí thư qua **RLS** (thêm/sửa/xóa mềm/tìm/lọc theo Khu phố·Trường·Trạng thái).
- Dashboard Bí thư + Admin lấy **dữ liệu thật** từ Supabase (đếm/tổng hợp, tỉ lệ điểm danh chỉ đọc).
- Import staging DB thật: lô nháp → nhập/sửa dòng (Họ tên/Ngày sinh/SĐT PH) → **xác nhận mới tạo học sinh** (không auto-import).
- Admin đọc thật: Khu phố / Bí thư / Phân công (chỉ đọc).

**Chưa làm (đúng phạm vi):** OCR AI, DOCX, Notification, Attendance workflow thật; full CRUD Admin.

**Chặn vận hành:** thiếu `SUPABASE_SERVICE_ROLE_KEY` → chưa tạo được 2 tài khoản yêu cầu
(Admin/`admin@123`, `0932077136`/`tho@123`) + Khu phố KP01 + phân công. Thêm key rồi chạy
`npm run bootstrap:auth`. Sau đó bắt đổi mật khẩu.

## Chi tiết Prompt 06B (Bootstrap thật + OCR import + notes)

**Đã làm:**
- **Bootstrap đã chạy** (user đã thêm service role key + reset DB): 2 auth users
  `admin@sinhhoathe.local` + `0932077136@sinhhoathe.local`, KP01, 1 phân công. **Test
  login thật** cả 2 (Admin→ADMIN, 0932077136→SECRETARY) — OK.
- **OCR server-side** (`src/lib/ocr/`): `types.ts` (interface `OcrProvider`), `ocrspace.ts`
  (adapter OCR.space Free API, key server-only, xử lý cả response lỗi `{error,details}`),
  `parse.ts` (heuristic VN: SĐT/ngày sinh/tên, chuẩn hóa `YYYY-MM-DD`, `+84`→`0`, bỏ tiêu đề),
  `index.ts` (`extractStudentsFromImage` + `hasOcrConfigured`).
- **Flow import** (`import/actions.ts`): `ocrExtractRows` (upload → validate file → OCR →
  chèn `import_batch_rows` `reviewed=false`, đánh dấu lô `source=OCR`); `updateRow`
  (sửa + `reviewed=true`); `confirmBatch` **chỉ tạo HS từ dòng `reviewed=true`**, đóng lô
  khi hết dòng chờ. UI: `OcrUploadForm`, `EditableRow` (nhãn "AI đọc — cần kiểm tra").
- **Config/bảo mật:** `checkOcrUploadFile` (mime whitelist + ≤1MB), `next.config`
  `serverActions.bodySizeLimit=2mb`, `env.ts` đọc `OCR_SPACE_API_KEY` (+ backward-compat
  `OCR_PROVIDER_KEY`). **Move key thật khỏi `.env.example`** (bị commit) sang `.env.local`.
- **Docs:** rewrite `ocr-import.md`; bổ sung `security.md` (session/JWT/AI); mới
  `devops-deploy-rollback-backup.md` + `ai-security-checklist.md`.

**Chưa làm (đúng phạm vi):** Attendance/DOCX/Notification thật; lưu ảnh gốc + audit import;
Google Vision/Gemini; nâng cấp UI lớn.

**Ghi chú vận hành:** OCR chạy production cần thêm `OCR_SPACE_API_KEY` vào env server Vercel
(không `NEXT_PUBLIC_`). Thiếu key → nút OCR vô hiệu, vẫn nhập tay được.

## Chi tiết Prompt 07 (Attendance workflow + Leave requests thật)

**Migration (additive, đã áp remote + gen types):**
- `20260706010000_session_lifecycle`: `activity_sessions.closed_at` (vòng đời buổi) + sửa
  **deadlock** `snb_insert` (buổi mới chưa có link → `can_access_session`=false → cho **người
  tạo** gắn Khu phố trong phạm vi).
- `20260706020000_sessions_select_creator`: `sessions_select` thêm `created_by = current_profile_id()`
  (tránh lỗi RLS khi `insert().select()` buổi mới; app cũng sinh id client-side, không dùng returning-select).
- `20260706030000_guardian_session_visibility`: helper **SECURITY DEFINER** `is_guardian_of_session`
  + `sessions_select`/`snb_select` cho **phụ huynh** xem buổi/Khu phố của con (nhánh join trước đây
  bị RLS của bảng tham chiếu chặn).

**Đã làm (qua RLS, KHÔNG service role):**
- Buổi: `lib/data/sessions.ts` (list/detail/roster + đếm); `sessions/actions.ts`
  (`createSession` sinh id client-side + gắn `session_neighborhoods`; `closeSession`/`reopenSession`).
- Điểm danh: `attendance/actions.ts#markAttendance` (upsert PRESENT/EXCUSED/UNEXCUSED;
  NOT_MARKED = xóa bản ghi; khóa khi `closed_at`). UI roster form server-render 4 nút/trạng thái.
- Xin nghỉ: `parent/leave-requests/actions.ts#submitLeaveRequest` (RLS is_guardian_of);
  `secretary/leave-requests/actions.ts` duyệt/từ chối; duyệt → upsert EXCUSED (nếu buổi mở).
- Dashboard Bí thư (`secretary-dashboard.ts`): buổi hôm nay/sắp tới, số cần điểm danh, CM/CP/KP
  tháng + tỉ lệ. Cổng Phụ huynh (`parent.ts`): con, lịch (RLS), lịch sử điểm danh. Admin sessions read-only.

**Sự cố đã xử lý (đúng gốc):**
- `insert().select()` buổi mới bị RLS chặn ở **returning-select** (chưa có link → chưa select được):
  sinh id client-side + policy `created_by`.
- Phụ huynh không thấy buổi: nhánh join `session_neighborhoods` trong policy chịu RLS bảng đó →
  dùng helper SECURITY DEFINER `is_guardian_of_session`.
- Đã verify bằng **smoke test ký tên Bí thư + Phụ huynh thật** (tạo student/session/attendance/leave,
  kiểm quyền, rồi **xóa sạch** — DB về 2 profiles/0 nghiệp vụ).

**Chưa làm (đúng phạm vi):** DOCX export, Notification thật, nâng cấp UI lớn. Chưa có tài khoản
Phụ huynh thật + liên kết guardian↔student trên môi trường (do Bí thư/Admin làm sau).

## Chi tiết Prompt 08A (Admin Control Center + accounts + session defaults + notifications)

**Migration:**
- `20260707010000_admin_center` (additive): `profiles.staff_title` (Bí thư/Chi Đoàn — chung quyền
  SECRETARY), `activity_sessions.canceled_at` (dừng/hủy buổi).
- `20260707020000_fix_notification_rls_recursion` (corrective): sửa **đệ quy RLS 42P17** giữa
  `notifications` ↔ `notification_recipients` bằng helper SECURITY DEFINER `is_notification_recipient`/
  `is_notification_creator` (cùng logic, hết đệ quy; không nới quyền).

**Đã làm:**
- **Tách cổng public:** `/` chỉ hiện cổng Người dùng; Admin tự vào `/admin` (bảo mật vẫn Auth/RBAC/RLS).
- **Provisioning (service role CHỈ cho auth user, sau `requireAdmin`):** `lib/admin/accounts.ts`
  (`createAuthUser`/`resetAuthPassword`, temp password không log). Hồ sơ/gán/liên kết qua **RLS server client**.
- **Staff** (`/admin/secretaries`): tạo Bí thư/Chi Đoàn, gán/bỏ Khu phố, reset mật khẩu tạm, khóa/mở.
- **Phụ huynh** (`/admin/parents`): tạo tài khoản + guardian, liên kết/bỏ liên kết học sinh (mở khóa cổng Phụ huynh).
- **Audit** (`lib/admin/audit.ts` + `/admin/audit`): ghi/append-only + xem; không log mật khẩu/token.
- **Buổi** (`sessions/actions.ts`): `cancelSession`/`uncancelSession`, `rescheduleSession`,
  `notifySessionParents` (gửi phụ huynh theo buổi qua RLS). Điểm danh khóa khi chốt/hủy.
- **Roster search:** `getSessionRoster(sessionId, q)` — tìm theo tên HS / SĐT phụ huynh.
- **Notifications thật:** `lib/data/notifications.ts` + trang Bí thư/Phụ huynh.
- **Templates foundation** (`/admin/templates` + `secretary/reports`): thêm/duyệt (bật/tắt), chặn `.docm`.
- Dashboard Admin thật (thêm phụ huynh/buổi hôm nay/đơn nghỉ chờ).

**Sự cố đã xử lý (đúng gốc):**
- **RLS đệ quy 42P17** notifications↔notification_recipients (lộ khi non-admin insert+select thông báo)
  → helper SECURITY DEFINER; verify insert+select OK sau fix.
- `gen types --linked` báo **Unauthorized** (thiếu access token) → thêm cột vào `database.types.ts`
  thủ công (khớp gen), verify cột tồn tại trên remote bằng service role.

**Verify:** smoke test ký tên **Admin + Bí thư + Phụ huynh thật**: tạo staff (staff_title), gán Khu phố,
khóa/mở, reset password, audit, tạo+liên kết phụ huynh, gửi thông báo buổi → phụ huynh nhận. **Dọn sạch**
(DB về 2 profiles/0 nghiệp vụ). Lint/typecheck/build pass.

**Chưa làm (đúng phạm vi):** upload binary DOCX + render thật (08B); một vài trang admin phụ (students/reports/
settings/neighborhoods/assignments) chưa CRUD đầy đủ; nâng cấp UI lớn.

## Chi tiết Prompt 08B (Tối ưu Admin + Vai trò phụ trách + Rà soát câu chữ)

**Migration (additive, đã áp remote + gen types thật):**
- `20260707030000_assignment_roles`: `secretary_neighborhoods.assignment_role` (`PRIMARY`/`COORDINATING`,
  mặc định `COORDINATING`, CHECK) + **partial unique index** `uq_snb_one_primary_per_neighborhood`
  (tối đa 1 Phụ trách chính/Khu phố). Không thêm/nới policy RLS (cột nằm trong `sn_*` sẵn có).
  Lần này `gen types --linked` chạy được (có token) → `database.types.ts` sinh lại thật.

**Đã làm (qua RLS, KHÔNG service role):**
- **Khu phố** (`lib/data/admin.ts#listNeighborhoodsDetailed`): danh sách kèm số học sinh/cán bộ/buổi +
  tên Phụ trách chính (tổng hợp in-memory, tránh N+1). Actions `neighborhoods/actions.ts`:
  `createNeighborhood`/`updateNeighborhood`/`setNeighborhoodActive` (ngừng hoạt động thay hard-delete).
- **Vai trò phân công** (`secretaries/actions.ts`): `assignNeighborhood(assignment_role)`,
  `setAssignmentRole`, `unassignNeighborhood`; `demoteExistingPrimary` hạ Phụ trách chính cũ trước khi
  nâng người mới (giữ ràng buộc 1 chính, tránh vi phạm unique index).
- **UI:** `/admin/assignments` viết lại theo góc nhìn Khu phố (chính + phối hợp + phân công/đổi vai
  trò/gỡ); `/admin/secretaries` hiển thị nhãn vai trò + form gán có chọn vai trò (chỉ Khu phố đang
  hoạt động); `/admin/secretaries` & `/admin/parents` thêm **tìm kiếm** (tên/SĐT `ilike` qua RLS).
- **Câu chữ:** bỏ số prompt nội bộ khỏi UI (templates, secretary/reports); thống nhất trạng thái/nhãn
  ("Đang hoạt động"/"Đã khóa"/"Ngừng hoạt động", "Phân công phụ trách"); giảm jargon.

**Verify:** smoke test **đăng nhập Admin thật** (publishable key, không service role): tạo Khu phố →
gán PRIMARY → đọc lại → đổi COORDINATING → đọc lại → dọn sạch. Tất cả OK. Lint/typecheck/build pass.

**Chưa làm (đúng phạm vi):** render DOCX thật + upload binary mẫu; `/admin/students`,`/admin/reports`,
`/admin/settings` giữ mức đọc/tối giản; nâng cấp UI lớn.
