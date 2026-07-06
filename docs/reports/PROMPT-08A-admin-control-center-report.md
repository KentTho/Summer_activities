# Báo cáo PROMPT 08A — Admin Control Center + Staff/Parent accounts + Session defaults + Notifications

- **Ngày:** 2026-07-07
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-07-attendance-leave-workflow-report.md`
- **Phạm vi:** Admin quản trị tài khoản thật (Bí thư/Chi Đoàn + Phụ huynh), gán/khóa/reset,
  liên kết phụ huynh↔HS, audit; `staff_title`; tách cổng public; buổi (hủy/dời/thông báo);
  điểm danh tìm kiếm; nền tảng mẫu báo cáo. **Không** render DOCX thật (để 08B); **không** nâng
  cấp UI lớn; **không** reset DB/drop/disable RLS/`using(true)`.

---

## A — Đọc lại trạng thái + audit guardrails (Phần A, yêu cầu 2)

Đọc progress/history/report 06B–07 + `engineering-guardrails.md`. **Audit guardrails:** doc
07 ngắn gọn, đúng, không lan man, không tạo bug ẩn → **giữ nguyên**, tham chiếu thêm ở 08A
(service role, RLS testing, DB security definer). Không thêm mục thừa.

## B — Migration

| Migration | Loại | Nội dung |
| --- | --- | --- |
| `20260707010000_admin_center` | additive | `profiles.staff_title` (Bí thư/Chi Đoàn), `activity_sessions.canceled_at` |
| `20260707020000_fix_notification_rls_recursion` | corrective | Sửa **đệ quy RLS 42P17** notifications↔notification_recipients bằng helper SECURITY DEFINER |

`db push` OK (CLI cache credential). `gen types --linked` báo **Unauthorized** → thêm cột vào
`database.types.ts` **thủ công** (khớp gen), verify cột tồn tại trên remote (service role).

## C — Tách public entry (yêu cầu 5)

`/` chỉ còn **một** cổng Người dùng (Bí thư · Chi Đoàn · Phụ huynh/HS). Bỏ nút Admin. Admin tự
gõ `/admin`(`/admin/login`). **Bảo mật thật vẫn là Auth + RBAC (layout guard) + RLS** — ẩn link
chỉ giảm bề mặt (ghi rõ trong comment).

## D — staff_title (yêu cầu 4)

`modules/auth/domain/staff-title.ts`: `STAFF_TITLES = ["Bí thư","Chi Đoàn"]`. Cả hai **chung
quyền SECRETARY** — không tạo role mới. Lưu ở `profiles.staff_title`, hiển thị nhãn ở danh sách.

## E — Admin Control Center (yêu cầu 3)

- **Guard:** `lib/auth/require-admin.ts#requireAdmin()` chạy đầu MỌI admin action.
- **Provisioning:** `lib/admin/accounts.ts` — `createAuthUser`/`resetAuthPassword` dùng **service
  role** (theo guardrail: CHỈ để tạo/reset auth user, sau requireAdmin). Temp password sinh ngẫu
  nhiên, **hiện 1 lần**, **không log**, set `must_change_password=true`.
- **Hồ sơ/gán/liên kết/audit:** đi qua **RLS server client** (Admin có quyền qua `is_admin()`).
- Trang `/admin/secretaries` (staff): tạo, gán/bỏ Khu phố, reset, **khóa/mở** (deactivate — không
  hard-delete; không tự khóa chính mình).
- Trang `/admin/parents`: tạo phụ huynh + guardian, **liên kết/bỏ liên kết học sinh** → mở khóa cổng Phụ huynh.
- Trang `/admin/audit`: audit_logs **thật** (append-only). Ghi qua `lib/admin/audit.ts` (không PII/secret).
- Dashboard Admin thật (thêm phụ huynh, buổi hôm nay, đơn nghỉ chờ).

## F — Buổi + thông báo (yêu cầu 6)

- `cancelSession`/`uncancelSession` (`canceled_at`), `rescheduleSession` (đổi ngày/giờ), buổi chung
  nhiều Khu phố (đã hỗ trợ từ 07). Điểm danh **khóa khi chốt HOẶC hủy**.
- `notifySessionParents` (qua RLS): tìm phụ huynh của HS trong Khu phố của buổi → tạo notification
  (scope SESSION) + notification_recipients. Trang notifications Bí thư/Phụ huynh **thật**.

## G — Điểm danh (yêu cầu 7)

Roster hiển thị toàn bộ HS + **tìm theo tên HS / SĐT phụ huynh** (`getSessionRoster(id, q)` dùng
`or(full_name.ilike, guardian_phone.ilike)`), đánh dấu nhanh (4 trạng thái, đã có).

## H — Report templates foundation (yêu cầu 8)

`/admin/templates`: thêm mẫu (tên + tên tệp `.docx`, **chặn `.docm`/macro** ở Zod refine),
**duyệt bật/tắt**; `secretary/reports` liệt kê mẫu **đang bật** (RLS tpl_select). Upload binary +
render DOCX server-side để **08B** (ghi rõ trên UI).

## I — Kiểm thử (yêu cầu 11–12)

| Bước | Kết quả |
| --- | --- |
| typecheck / lint / build | ✅ Pass (route mới `/admin/parents`, `/admin/secretaries`…) |
| Guard route bảo vệ | ✅ (giữ từ 05; `/admin/*` yêu cầu ADMIN) |
| **Smoke test RLS ký tên thật** (Admin + Bí thư + Phụ huynh) | ✅ Xem dưới |

**Smoke (không service role cho read/write thường; service role chỉ tạo/reset auth user):**
tạo staff (staff_title=Chi Đoàn) · gán Khu phố · khóa/mở · reset mật khẩu · ghi/đọc audit · admin
tạo+liên kết phụ huynh↔HS · Bí thư resolve người nhận + gửi thông báo buổi · **Phụ huynh nhận
thông báo** · Bí thư thấy thông báo đã gửi → **tất cả OK**. **Dọn sạch** (DB về 2 profiles/0 nghiệp vụ).

**Sự cố đã xử lý (đúng gốc):**
1. **RLS đệ quy 42P17**: `notif_select` đọc `notification_recipients` (chịu `nr_select`), mà
   `nr_select` đọc `notifications` → đệ quy. Lộ khi Bí thư `insert().select()` thông báo. Sửa bằng
   helper **SECURITY DEFINER** (bỏ qua RLS nội bộ). Verify insert+select OK sau fix.
2. `gen types --linked` **Unauthorized** (thiếu access token) → thêm 2 cột vào types thủ công + verify remote.

## J — Tuân thủ quy tắc

- ✅ Không phá Auth/RBAC/CRUD/OCR/Attendance/Leave; không reset DB/drop/disable RLS/`using(true)`.
- ✅ Service role **chỉ** tạo/reset auth user trong action đã `requireAdmin()`; không ra client.
- ✅ Reset chỉ tạo mật khẩu tạm + `must_change_password`; Admin không xem mật khẩu thật; không log secret.
- ✅ "Xóa" = deactivate (không hard-delete). Bí thư/Chi Đoàn chung quyền, khác nhãn.
- ✅ Mẫu chỉ nhận `.docx` (chặn `.docm`/macro); không cho nhập HTML/CSS/JS tùy ý.
- ✅ Migration additive/corrective; lỗi ghi rõ nguyên nhân/cách fix; cập nhật progress/history.
