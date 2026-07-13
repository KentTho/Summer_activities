# User Portal flow redesign (10F)

Tổng hợp thay đổi luồng User Portal ở 10F. **Không đổi RLS/schema/migration**;
server action + RLS vẫn là guard cuối.

## 1. Nav consolidation
`src/components/layout/nav-config.ts` (SECRETARY): 9 → 7 mục.
- Bỏ "Điểm danh" (điểm danh nằm trong chi tiết buổi).
- "Đơn xin nghỉ" + "Thông báo" → "Đơn & thông báo" (`/user/secretary/operations`).
Xem `docs/user-portal-navigation-map.md`.

## 2. Route compatibility (không 404)
Route cũ giữ lại dưới dạng redirect:
- `/attendance` → `/sessions`
- `/leave-requests` → `/operations?tab=leave`
- `/notifications` → `/operations?tab=notifications`

## 3. Operations page
`/user/secretary/operations` — 2 tab (`OperationsTabs`):
- **Đơn xin nghỉ** (`LeaveRequestsPanel`): filter chờ/tất cả, duyệt/từ chối →
  toast (action trả `LeaveActionState`). Duyệt vẫn tự đánh "Nghỉ có phép" cho buổi mở.
- **Thông báo phụ huynh** (`NotificationsPanel`): composer chọn buổi → soạn → gửi
  (tái dùng `notifySessionParents`, người nhận do buổi/RLS) + lịch sử đã gửi.
- Tab khởi tạo theo `?tab=` (leave|notifications).

## 4. Session action logic cleanup
`sessionActionRules.ts` (`getSessionActionAvailability`, `isPastSessionDate`):
| Trạng thái | Nút hiện |
|---|---|
| Đã hủy | Khôi phục |
| Đã chốt | Mở lại |
| Đã qua (còn mở) | Chốt (tổng kết) — ẩn Dời/Hủy, có InlineAlert giải thích |
| Đang mở & chưa qua | Chốt · Dời · Hủy |
| Gửi thông báo | ẩn khi đã hủy |
`SessionControlsClient` gọi helper để ẩn/hiện + giải thích; server action guard cuối.

## 5. Joint session / multi-neighborhood attendance
`AttendanceRosterClient`:
- Buổi >1 Khu phố → selector "Khu phố điểm danh" (Tất cả / từng Khu phố) với số đếm.
- Roster + bộ đếm (CM/CP/KP/chưa) lọc theo Khu phố đang chọn; "Tất cả" = tổng buổi.
- Chỉ hiển thị Khu phố trong roster do server trả (RLS đã lọc theo phạm vi Bí thư) →
  **không nới RLS**, không điểm danh Khu phố ngoài phạm vi.
Chi tiết buổi hiển thị badge tất cả Khu phố tham gia.

## 6. Session detail layout
- Container 7xl (shell); split-pane `xl:grid-cols-3` (roster 2/3 · rail sticky 1/3).
- Header: back + title + badge (loại/trạng thái/đã qua) + metadata + badge Khu phố.

## 7. Toast coverage (mở rộng)
Điểm danh · điều khiển buổi · gửi thông báo · đơn xin nghỉ · học sinh (thêm/sửa) ·
import (AI extract / lưu dòng) · hồ sơ cá nhân (dùng chung 3 cổng).

## 8. Chưa làm (backlog 10F)
- Full redesign dense: dashboard, students/import table shell, reports loading, parent timeline.
- Toast xóa mềm học sinh, confirm batch (một số form void).
- Avatar / parent request-edit / realtime → 10H.
