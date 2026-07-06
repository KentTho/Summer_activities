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
