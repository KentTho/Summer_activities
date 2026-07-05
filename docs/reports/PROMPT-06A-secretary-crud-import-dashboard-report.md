# Báo cáo PROMPT 06A — Bootstrap accounts + Secretary CRUD + Dashboard thật + Import staging

- **Ngày:** 2026-07-05
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-05-real-auth-rbac-guard-report.md`
- **Phạm vi:** đăng nhập bằng identifier, CRUD học sinh cho Bí thư (qua RLS), dashboard Bí
  thư dữ liệu thật, import staging (DB thật, chưa OCR), dashboard/list Admin đọc thật.
  **Không** Attendance/OCR/DOCX/Notification thật; **không** nâng cấp UI lớn.

---

## A — Thay đổi Database (additive, đã áp remote)

Migration mới `supabase/migrations/20260705020000_students_import_fields.sql` — **chỉ THÊM cột**,
idempotent, **không** đổi RLS:

```
students: + birth_date date, + school text, + guardian_name text, + guardian_phone text
        + index idx_students_school
```

- `supabase db push` (dry-run rồi apply) → remote có đủ **4/4 migration** (local ↔ remote khớp).
- `supabase gen types typescript --linked` → `src/lib/database.types.ts` cập nhật (có cột mới).
- Lý do: yêu cầu import cần **Họ tên · Ngày sinh · SĐT phụ huynh**; lọc theo **Trường học**.
  Denormalize `guardian_name/phone` lên `students` cho MVP (liên kết bảng guardians để sau).

## B — Đăng nhập bằng identifier (yêu cầu 4)

- `src/lib/auth/identifier.ts#identifierToEmail()` — ánh xạ tất định:
  email (có "@") giữ nguyên · số điện thoại → `<digits>@sinhhoathe.local` · tên → `<slug>@…`.
- `signInWithPortal` dùng identifier (field `identifier`) thay email; `LoginForm` đổi field text.
- Admin nhập **"Admin"**, Bí thư nhập **"0932077136"** đều đăng nhập được (cùng quy tắc với bootstrap).

## C — Bootstrap tài khoản thật (yêu cầu 1–2) — ⚠️ CHƯA CHẠY (thiếu service role key)

`scripts/bootstrap-auth-users.mjs` (`npm run bootstrap:auth`) tạo:

| Tài khoản | Mật khẩu (khởi tạo) | Role | Ghi chú |
| --- | --- | --- | --- |
| `Admin` | `admin@123` | ADMIN | `must_change_password=true` |
| `0932077136` | `tho@123` | SECRETARY | phone lưu ở profile |

+ tạo Khu phố `KP01` và **gán Bí thư phụ trách** (để CRUD học sinh hoạt động). Idempotent,
không log password/token.

> **`SUPABASE_SERVICE_ROLE_KEY` vẫn KHÔNG có trong `.env.local`** → theo quy tắc, **dừng phần
> bootstrap**; chưa tạo được auth users. **Cần bạn** thêm service role key (server-only) vào
> `.env.local` rồi chạy `npm run bootstrap:auth`. Vì chưa có tài khoản nên **chưa test được
> đăng nhập/CRUD end-to-end** trên môi trường (guard "chưa đăng nhập → login" đã test 307).
> **Nên bắt đổi mật khẩu** sau lần đăng nhập đầu (đã đặt cờ metadata).

## D — CRUD học sinh cho Bí thư (yêu cầu 3, 5) — qua RLS, không service role

- Data đọc: `src/lib/data/students.ts` (list + lọc, khu phố trong phạm vi, danh sách trường).
- Server Actions: `src/app/user/secretary/students/actions.ts` — `createStudent`,
  `updateStudent`, `softDeleteStudent` (đặt `deleted_at`+`active=false`). Tất cả dùng
  **server client (RLS)**; hard-delete là đặc quyền Admin nên Bí thư chỉ **xóa mềm/ngừng**.
- UI: `students/page.tsx` (lọc GET: tìm tên/Khu phố/Trường/Trạng thái) + `StudentForm.tsx`
  (thêm/sửa, `useActionState`). RLS đảm bảo Bí thư chỉ thao tác học sinh **Khu phố phụ trách**.

## E — Dashboard Bí thư dữ liệu thật (yêu cầu 6)

`src/lib/data/secretary-dashboard.ts#getSecretaryOverview()`:
tổng/đang-học học sinh trong phạm vi · buổi sắp tới (≥ hôm nay) · đơn nghỉ `SUBMITTED` ·
**tỉ lệ điểm danh tháng** (chỉ đọc, tính từ `attendance_records.marked_at` nếu có; null nếu chưa có).

## F — Import staging (yêu cầu 7) — DB thật, KHÔNG auto-import

- Bảng thật: `import_batches` (DRAFT) + `import_batch_rows` (raw_data jsonb).
- `import/page.tsx`: `CreateBatchForm` (chọn ảnh/PDF chỉ lấy **tên tệp**, chưa OCR/chưa upload nội dung) + danh sách lô.
- `import/[batchId]/page.tsx`: `AddRowForm` nhập dòng nháp (**Họ tên** bắt buộc · Ngày sinh · SĐT PH · phụ), xóa dòng,
  và nút **"Xác nhận & tạo N học sinh"**.
- `confirmBatch` là **bước xác nhận bắt buộc**: chỉ khi bấm mới tạo `students` (theo Khu phố của lô),
  đánh dấu `created_student_id`, chuyển lô sang `COMMITTED`. **Không** ghi thẳng khi chưa confirm.

## G — Admin tối thiểu, dữ liệu thật (yêu cầu 8)

- `src/lib/data/admin.ts`: `getAdminOverview` (đếm Khu phố/Bí thư/HS/buổi) + list Khu phố/Bí thư/Phân công.
- `admin` dashboard + `neighborhoods`/`secretaries`/`assignments` đọc **thật** (chỉ đọc; full CRUD để sau).
- Các trang Admin còn lại (students/sessions/templates/reports/audit/settings) **giữ nguyên** — chưa trong scope.

## H — Điều chỉnh UI nhỏ

- Bỏ banner `DemoNotice` cố định trong `DashboardShell` (nhiều trang đã là dữ liệu thật).
  Các trang còn dùng mock (attendance/notifications/reports Bí thư, cổng Phụ huynh) vẫn giữ nguyên nội dung.

## I — Kiểm tra chất lượng

| Bước | Kết quả |
| --- | --- |
| `npm run typecheck` | ✅ Pass |
| `npm run lint` | ✅ Pass |
| `npm run build` | ✅ Pass (route mới `/user/secretary/import/[batchId]`) |
| Guard smoke (local, chưa đăng nhập) | ✅ Trang mới `/user/secretary/students`, `/import`, `/admin/*` → 307 login |

**Sự cố đã xử lý:** `attendance_records` không có `created_at` → dùng `marked_at`
(typecheck bắt lỗi, đã sửa đúng gốc).

## J — Tuân thủ quy tắc

- ✅ Không Attendance workflow/OCR/DOCX/Notification thật (attendance chỉ đọc tỉ lệ).
- ✅ Migration **additive**, không drop table/không đổi/disable RLS; không seed demo bừa.
- ✅ CRUD/Import đi qua **RLS** bằng server client — **không** bypass bằng service role ở UI.
- ✅ Bí thư chỉ thao tác học sinh Khu phố phụ trách (RLS); import **không** auto-commit.
- ✅ Không đưa service role vào client; service role chỉ ở script; không hardcode/không log secret.
- ✅ Thiếu service role key → dừng bootstrap, báo user (không tự đoán key).
- ✅ Không commit `.env.local`/`.vercel/`/`supabase/.temp`/secret (đã gitignore).
