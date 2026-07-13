# Interaction optimization — 10E

Ghi lại các tối ưu tương tác của prompt 10E: điểm danh optimistic, toast feedback,
layout desktop, và login redirect. **Không đổi RLS/schema/migration**; server action
vẫn là nơi kiểm tra nghiệp vụ, RLS là guard cuối.

## 1. Toast system
- `src/components/ui/ToastProvider.tsx` — provider + hook `useToast()` nhẹ, không thư viện ngoài.
- Góc phải-trên, `aria-live="polite"` (lỗi/cảnh báo `role="alert"`), tự ẩn ~3.2s, nút đóng.
- Bọc trong `DashboardShell` → phủ toàn bộ cổng Admin + User.
- `useToast()` an toàn khi chưa có provider (trả no-op) — không vỡ component tái dùng.
- API: `toast.success/error/info/warning(message)`.

### Toast được dùng ở đâu (10E)
| Nơi | Sự kiện | Loại |
|---|---|---|
| `AttendanceRosterClient` | cập nhật điểm danh OK / lỗi | success / error |
| `SessionControlsClient` | chốt/mở/hủy/khôi phục/dời buổi | success / error |
| `NotifyParentsForm` | gửi thông báo phụ huynh | success / error |

## 2. Attendance optimistic UI
File:
- `src/app/user/secretary/attendance/actions.ts` — `markAttendanceAction(input)` trả
  `{ ok, error? }`, **không** `revalidatePath` cả trang.
- `AttendanceRosterClient.tsx` — state nguồn sự thật ở client cho optimistic.
- `AttendanceStatusButtons.tsx` — nhóm nút thuần trình bày.

Luồng click:
1. Cập nhật local state ngay + thêm student vào `pending` (khóa nút hàng đó).
2. Gọi `markAttendanceAction`.
3. OK → toast "Đã cập nhật điểm danh"; lỗi/exception → **rollback** trạng thái cũ + toast lỗi.
4. `finally` gỡ pending.

Đặc điểm:
- **Counter optimistic** (Có mặt / có phép / không phép / chưa điểm danh) tính từ local state.
- **Tìm kiếm client-side** (`useDeferredValue`) — không reload, không mất cuộn.
- **Chống double-click/race**: nút hàng đang gửi bị `disabled`; bỏ qua click trùng trạng thái.
- **Không mất trạng thái**: search + scroll giữ nguyên vì không điều hướng.
- **Buổi chốt/hủy**: `locked` → ẩn nút, action cũng chặn (server đọc `closed_at`/`canceled_at`).
- Trang `force-dynamic` nên mỗi lần refresh/điều hướng vẫn fetch DB thật (đối chiếu được).

## 3. Session detail desktop layout
`src/app/user/secretary/sessions/[sessionId]/page.tsx`:
- Container rộng hơn (DashboardShell `max-w-5xl` → `max-w-6xl`) → giảm khoảng trống desktop.
- Lưới `xl:grid-cols-3`:
  - **Cột chính (2/3)**: card "Điểm danh" chứa counter + tìm kiếm + roster **cuộn riêng** (`max-h-[62vh] overflow-y-auto`).
  - **Cột phải (1/3) sticky** (`xl:sticky xl:top-20`): điều khiển buổi + gửi thông báo.
- Mobile: stack dọc, nút điểm danh đủ lớn (h-8 px-2.5, wrap).

## 4. Login redirect
Xem chi tiết `docs/auth-redirect-flow.md`. Tóm tắt: đã có phiên vào `/user/login`
hay `/admin/login` → redirect thẳng `homeForRole(role)`; `must_change_password` →
`/change-password` (không hop thừa). Không loop, không "quay lại trang chủ".

## 5. Redundant step cleanup
- Bỏ form tìm kiếm GET (reload trang) ở roster → tìm client-side.
- Bỏ `searchParams.q` khỏi session detail (không cần round-trip server để lọc).
- Điểm danh không còn 4 `<form>` submit riêng cho mỗi trạng thái.

## Backlog (không làm trong 10E)
- Toast cho CRUD học sinh, đơn nghỉ, profile, thông báo Admin (hệ thống toast đã sẵn).
- Avatar private storage, Parent request-edit, realtime notification → 10F/10G.
