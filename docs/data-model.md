# Mô hình dữ liệu (tóm tắt)

Supabase Postgres, **RLS bật ở mọi bảng nghiệp vụ/dữ liệu cá nhân**. Khóa chính `uuid`; có
`created_at`, `updated_at`, `created_by` cho bảng nhạy cảm; soft delete cho thực thể nghiệp vụ chính.

> **Cập nhật 04B:** schema thật + RLS đã được viết trong `supabase/migrations/`
> (`20260705010000_core_schema`, `…010100_rls_helpers`, `…010200_rls_policies`) +
> `supabase/seed.sql` (dev) + `supabase/tests/rls_smoke.sql`. Chưa `db push` remote
> (cần `supabase link` — xem `supabase/README.md`).

## Bảng chính
| Bảng | Mục đích |
| --- | --- |
| `profiles` | Hồ sơ người dùng gắn auth; giữ `role` (ADMIN/SECRETARY/PARENT) |
| `neighborhoods` | Danh mục Khu phố (trục phân quyền lõi) |
| `secretary_neighborhoods` | Gán Bí thư ↔ nhiều Khu phố |
| `guardians` | Thông tin phụ huynh liên hệ/đăng nhập |
| `students` | Hồ sơ học sinh; `neighborhood_id` bắt buộc |
| `student_guardians` | Liên kết học sinh ↔ phụ huynh |
| `activity_sessions` | Buổi sinh hoạt (`session_type`: REGULAR/JOINT) |
| `session_neighborhoods` | Khu phố tham gia buổi (đặc biệt buổi chung) |
| `session_permissions` | Grant quyền đặc biệt theo buổi chung |
| `attendance_records` | Kết quả điểm danh (`PRESENT`/`EXCUSED`/`UNEXCUSED`) |
| `leave_requests` | Xin phép nghỉ trước buổi |
| `notifications` / `notification_recipients` | Thông báo & trạng thái đọc |
| `uploaded_documents` | Metadata file upload/scan/template |
| `import_batches` / `import_batch_rows` | Import staging (AI Gemini/nhập tay; enum DB cũ vẫn có `OCR`) |
| `export_templates` | Template DOCX an toàn |
| `audit_logs` | Log thao tác nhạy cảm |
| `system_settings` | Cấu hình theme an toàn (whitelist field) |

## Enum đã khai báo trong domain (Phase 1)
- `Role` — `modules/auth/domain/roles.ts`
- `AttendanceStatus` — `modules/attendance/domain/attendance-status.ts`
- `SessionType` — `modules/sessions/domain/session-type.ts`
- `LeaveStatus` — `modules/leave-requests/domain/leave-status.ts`
- `NotificationScope` — `modules/notifications/domain/scope-type.ts`

## RLS helper (Phase 2)
`is_admin(auth.uid())` · `current_profile_id(auth.uid())` · `can_access_neighborhood(profile_id, neighborhood_id)`
· `can_access_session(profile_id, session_id)` · `can_access_student(profile_id, student_id)`.
