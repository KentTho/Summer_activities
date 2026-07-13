# Workflow / Step audit — 10E

Rà soát thao tác Admin/User theo tiêu chí **người dùng thật thao tác nhanh, ít
bước, ít reload**. Cột "Fix trong 10E" = đã xử lý ở prompt này; "Backlog" = ghi
nhận, làm sau. Không sửa lan man ngoài các điểm ưu tiên.

Chú thích cột: **Flow** | **Hiện trạng** | **Bước dư/thao tác chậm** | **Rủi ro bug ẩn** | **Fix 10E** | **Backlog**

## 1. Auth / login / logout / mật khẩu

| Flow | Hiện trạng | Bước dư/chậm | Rủi ro | Fix 10E | Backlog |
|---|---|---|---|---|---|
| Đăng nhập | Form → server action → redirect role home | Đã có phiên vẫn render form/quay lại | — | ✅ đã có phiên → redirect thẳng portal | — |
| Đã login vào lại /login | Trước: redirect role home (thêm 1 hop nếu must-change) | 1 hop thừa khi `must_change_password` | Loop nếu guard sai | ✅ đi thẳng `/change-password` | — |
| Sai vai trò | Layout redirect `homeForRole` | — | — | Giữ nguyên (đúng) | — |
| Đăng xuất | Form server action → login | — | — | Giữ nguyên | — |
| Quên mật khẩu | User: gửi yêu cầu → Admin cấp lại; Admin: break-glass | Nhiều bước (bản chất bảo mật) | — | — | Email tự phục hồi (backlog) |
| Đổi mật khẩu | `/change-password` ngoài layout cổng | — | Loop nếu đặt trong layout | Giữ nguyên (đã đúng) | — |

## 2. Bí thư / Chi Đoàn

| Flow | Hiện trạng | Bước dư/chậm | Rủi ro | Fix 10E | Backlog |
|---|---|---|---|---|---|
| Dashboard | Số liệu thật | — | — | — | — |
| Danh sách buổi | Card list, hôm nay ưu tiên | — | — | Rộng hơn nhờ container 6xl | — |
| **Điểm danh (buổi)** | Trước: mỗi nút = 1 `<form>` server action + `revalidatePath` → reload cả trang | **Click chậm, reload nặng, mất cuộn/tìm kiếm** | Double-submit/race | ✅ optimistic client, pending theo hàng, toast, counter optimistic, không reload | — |
| Tìm kiếm roster | Trước: form GET reload trang | Reload, mất vị trí | — | ✅ tìm client-side debounce (`useDeferredValue`) | — |
| Chốt/mở/hủy/khôi phục buổi | Server action void, im lặng | Không có phản hồi rõ | — | ✅ toast qua `SessionControlsClient` | — |
| Dời buổi | Server action void | Không phản hồi | — | ✅ toast | — |
| Gửi thông báo phụ huynh | `useActionState` (có text inline) | — | — | ✅ thêm toast | — |
| Học sinh (CRUD) | Form server action + redirect | Sau lưu chưa có toast | — | — | Toast + giữ trang (backlog) |
| Đơn nghỉ (duyệt/từ chối) | Server action | Chưa có toast | — | — | Toast (backlog) |
| Import AI | staging + confirm | Nhiều bước (bản chất an toàn) | — | — | Toast confirm (backlog) |
| Thông báo (list) | mark-read | — | — | — | Realtime (10F) |
| Profile | RPC tự cập nhật | Sau lưu chưa toast | — | — | Toast (backlog) |

## 3. Phụ huynh / Học sinh

| Flow | Hiện trạng | Bước dư/chậm | Rủi ro | Fix 10E | Backlog |
|---|---|---|---|---|---|
| Dashboard | Thật (con liên kết) | — | — | — | — |
| Lịch sinh hoạt | Read-only | — | — | — | — |
| Điểm danh (lịch sử) | Read-only | — | — | — | — |
| Xin nghỉ | Server action | Chưa toast | — | — | Toast (backlog) |
| Thông báo | mark-read | — | — | — | Realtime (10F) |
| Profile | Xem HS liên kết (read-only) | — | Parent KHÔNG được sửa HS | — | Request-edit (10F) |

## 4. Admin

| Flow | Hiện trạng | Bước dư/chậm | Rủi ro | Fix 10E | Backlog |
|---|---|---|---|---|---|
| Dashboard | KPI + cảnh báo phân công | — | — | Rộng hơn (6xl) | — |
| Tài khoản (Bí thư/PH) | CRUD + reset mật khẩu | Chưa toast | — | — | Toast (backlog) |
| Khu phố | CRUD + số liệu | Chưa toast | — | — | Toast (backlog) |
| Phân công | Vai trò chính/phối hợp | 2 Bí thư chưa gán | — | — | Gán Khu phố (chờ Admin) |
| Học sinh | Read-only tổng quan | Chưa CRUD ở Admin | — | — | Admin edit students (backlog) |
| Buổi | Read-only tổng quan | — | — | — | — |
| Thông báo hệ thống | Gửi SYSTEM/NEIGHBORHOOD | Chưa toast | — | — | Toast (backlog) |
| Password requests | PENDING → resolve/reject | Chưa toast | — | — | Toast (backlog) |
| Reports/settings/audit | Thật | — | — | — | — |

## Kết luận ưu tiên 10E
1. **Điểm danh** là điểm đau lớn nhất (4 nút reload cả trang) → đã tối ưu optimistic.
2. **Login redirect** dư bước → đã sửa vào thẳng portal.
3. **Feedback thao tác buổi** thiếu → đã thêm toast.
4. Các toast còn lại (CRUD học sinh/đơn nghỉ/profile/Admin) → **backlog** (hệ thống
   toast đã sẵn sàng, áp dần ở prompt sau, không dồn hết vào 10E).
