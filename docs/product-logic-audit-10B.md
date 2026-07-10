# Product Logic Audit — 10B

Rà soát logic từng tính năng User/Admin theo góc nhìn **dùng thật**. Cột "Hành động 10B" chỉ gồm việc
đã/đang làm trong 10B; phần còn lại → **Backlog** (không sửa lan man).

Thang đánh giá "Hợp lý khi dùng thật?": ✅ ổn · ⚠️ dùng được nhưng thiếu bước · 🔴 dễ gây bug ẩn.

## 1. Admin
| Tính năng | Hiện trạng | Hợp lý? | Rủi ro bug ẩn | Hành động 10B | Backlog |
|---|---|---|---|---|---|
| Dashboard | KPI + cảnh báo phân công + audit gần đây (RLS) | ✅ | Số liệu lớn có thể chậm nếu không phân trang | — | Cache/streaming KPI |
| Accounts (staff/parent) | Tạo qua service role sau requireAdmin; reset mật khẩu tạm | ✅ | — | — | — |
| Secretaries | CRUD + gán Khu phố | ✅ | — | — | — |
| Parents | CRUD + liên kết guardian↔student | ⚠️ | Liên kết sai học sinh khó phát hiện | — | Xác nhận 2 bước khi liên kết |
| Neighborhoods | CRUD + số liệu | ✅ | — | — | — |
| Assignments | Vai trò chính/chung, ràng buộc 1 chính/Khu phố (DB) | ✅ | — | — | — |
| Students | Đọc + tìm/lọc + export | ⚠️ | Chưa hiện năm sinh/giới tính/chữ ký mới | Backlog UI hiện field mới | Cột giới tính/chữ ký ở bảng Admin |
| Sessions | Xem tổng quan (read-only) | ✅ | — | — | — |
| Reports | Số liệu thật + xuất DOCX | ✅ | — | — | — |
| Templates | Upload private, chặn macro | ✅ | — | — | — |
| Notifications (hệ thống) | SYSTEM/NEIGHBORHOOD (09H) | ✅ | SYSTEM gửi mọi profile — volume | — | Xác nhận trước khi gửi diện rộng |
| Settings | Whitelist + audit | ✅ | — | — | — |
| Audit log | Append-only, xem theo trang | ✅ | — | — | Lọc theo action/actor |
| **Profile (mới)** | `/admin/profile` tự cập nhật họ tên/SĐT | ✅ | — | **Thêm 10B** | Ảnh đại diện |

## 2. Bí thư / Chi Đoàn
| Tính năng | Hiện trạng | Hợp lý? | Rủi ro bug ẩn | Hành động 10B | Backlog |
|---|---|---|---|---|---|
| Dashboard | HS trong phạm vi, buổi, đơn nghỉ, tỉ lệ | ✅ | — | — | — |
| Students | CRUD qua RLS, tìm/lọc | ⚠️ | Chưa hiện/sửa giới tính/chữ ký | Backlog form HS thêm field | Form CRUD HS: gender/signature |
| Sessions | Tạo/sửa/chốt/hủy/dời | ✅ | Hủy/dời không lý do bắt buộc | — (09H đã tự thông báo) | Bắt buộc lý do khi hủy |
| Attendance | 4 trạng thái, tìm theo tên/SĐT | ✅ | — | — | — |
| Leave requests | Duyệt/từ chối, gợi ý EXCUSED | ✅ | — | — | — |
| Import AI | Staging bắt buộc, ảnh private, rate-limit | ⚠️ | Trước 10B thiếu năm sinh/giới tính/chữ ký | **Nâng field 10B** | Ảnh crop chữ ký (private) |
| Reports | Export DOCX theo phạm vi | ✅ | — | — | — |
| Notifications | Gửi theo buổi + nhận | ✅ | — | — | — |
| **Profile (mới)** | `/user/secretary/profile` + Khu phố phụ trách | ✅ | — | **Thêm 10B** | — |

## 3. Phụ huynh / Học sinh
| Tính năng | Hiện trạng | Hợp lý? | Rủi ro bug ẩn | Hành động 10B | Backlog |
|---|---|---|---|---|---|
| Dashboard | Lịch/điểm danh con | ✅ | — | — | — |
| Schedule | Buổi của Khu phố con | ✅ | — | — | — |
| Attendance | Lịch sử điểm danh con | ✅ | — | — | — |
| Leave requests | Gửi xin nghỉ (chỉ con liên kết) | ✅ | — | — | — |
| Notifications | Nhận + unread + mark-read | ✅ | — | — | — |
| **Profile (mới)** | `/user/parent/profile` + HS liên kết (chỉ xem) | ✅ | Sửa dữ liệu HS nhạy cảm | **Thêm 10B (chỉ xem HS)** | Quy trình đề nghị sửa qua Bí thư |

## Kết luận
- Nền tảng logic **đủ dùng thật quy mô pilot**. Không cần refactor lớn.
- 10B bổ sung: **Profile center 3 vai trò** + **AI import field mở rộng** (năm sinh/giới tính/chữ ký, không suy đoán).
- Ưu tiên backlog: form CRUD học sinh hiển thị/sửa giới tính+chữ ký; xác nhận trước khi gửi notification diện rộng;
  ảnh đại diện; quy trình phụ huynh đề nghị sửa thông tin học sinh.
