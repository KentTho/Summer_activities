# Hệ thống thông báo (Notification) — Phase 11 core (09H)

Thông báo **trong ứng dụng** (không SMS/email thật). Người nhận xem ở mục “Thông báo” trên cổng của mình.

## Mô hình dữ liệu
- `notifications` — `id, title, body, scope, neighborhood_id, session_id, created_by, created_at`.
  `scope ∈ {SESSION, NEIGHBORHOOD, SYSTEM}` (enum `notification_scope`).
- `notification_recipients` — `id, notification_id, profile_id, read_at`, unique `(notification_id, profile_id)`.
  `read_at` = mốc đã đọc (null = chưa đọc).

## RLS (không đệ quy — helper SECURITY DEFINER)
- `notif_select`: admin | người tạo | người nhận (qua `is_notification_recipient(id)`).
- `nr_select`: admin | chính chủ | người tạo thông báo (qua `is_notification_creator(notification_id)`).
- `nr_update`: **chỉ người nhận cập nhật `read_at` của chính mình** → mark-read an toàn.
- `notif_insert`/`nr_insert`: admin hoặc secretary. **Không** service role, **không** `using(true)`.

## Luồng tạo
- **Bí thư/Chi Đoàn theo buổi** (`notifySessionParents`): gửi phụ huynh liên quan buổi (scope SESSION).
- **Tự động khi HỦY buổi** (`cancelSession`): gửi “Hủy buổi: …” + lý do (nếu có) + ngày. Best-effort.
- **Tự động khi DỜI buổi** (`rescheduleSession`): gửi “Đổi lịch: …” kèm giờ/ngày cũ→mới. Best-effort.
- **Admin gửi hệ thống/Khu phố** (`/admin/notifications`): scope SYSTEM (mọi hồ sơ active trừ người gửi)
  hoặc NEIGHBORHOOD (phụ huynh của học sinh thuộc Khu phố). Audit `SEND_SYSTEM_NOTIFICATION` (không PII).

Helper dùng chung: `src/lib/data/notifications.ts`
(`getSessionRecipientProfileIds`, `getNeighborhoodParentProfileIds`, `sendNotificationToProfiles`).

## Đọc / chưa đọc
- `countMyUnreadNotifications()` — đếm `read_at is null` của người đăng nhập (cho badge).
- `markNotificationRead(id)` / `markAllNotificationsRead()` — cập nhật `read_at` (qua RLS nr_update).
- Cổng **Phụ huynh** hiển thị số chưa đọc + nút “Đánh dấu đã đọc” / “…tất cả”; dòng chưa đọc tô nổi.

## Near-real-time (MVP)
Đếm/đánh dấu render **server-side**; cập nhật khi tải trang hoặc sau hành động (`revalidatePath`).
Chưa dùng Supabase Realtime subscription — coi là **near-real-time**. Nâng cấp realtime là backlog
(subscribe `notification_recipients` theo `profile_id`).

## Audit
- Hủy/dời buổi tự gửi → `NOTIFY_SESSION_PARENTS` (số người nhận, không PII).
- Admin gửi → `SEND_SYSTEM_NOTIFICATION` (scope + số người nhận).

## Không làm ngay
- SMS/email/push thật; realtime subscription; gom nhóm/đánh dấu quan trọng; lịch gửi hẹn giờ.
