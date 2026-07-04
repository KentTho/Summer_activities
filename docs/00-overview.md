# 00 — Tổng quan sản phẩm

## Mục tiêu
Thay thế điểm danh giấy bằng web-app **mobile-first**: Bí thư quản lý danh sách học sinh, lập lịch
sinh hoạt, điểm danh nhanh, tổng hợp nghỉ có phép/không phép và xuất báo cáo DOCX. Nhẹ để triển khai
cho dự án nhỏ–vừa nhưng vẫn chuẩn bảo mật, audit và phân quyền dữ liệu chặt.

## Ba vai trò
| Vai trò | Mục tiêu chính |
| --- | --- |
| **Admin** | Tạo Bí thư, gán Khu phố, xem audit log, quản lý template DOCX |
| **Bí thư (Secretary)** | CRUD học sinh, lập buổi sinh hoạt, điểm danh, thông báo, xuất báo cáo — trong phạm vi Khu phố được giao |
| **Phụ huynh/Học sinh (Parent)** | Xem lịch, nhận thông báo, gửi xin phép nghỉ, xem trạng thái điểm danh của mình |

## Trục phân quyền lõi: Khu phố
Mọi hồ sơ học sinh gắn với **đúng một Khu phố gốc**. Bí thư chỉ thao tác trên Khu phố trong bảng gán
phụ trách. Buổi sinh hoạt **chung nhiều Khu phố** là một `activity_session` có nhiều
`session_neighborhoods`; quyền điểm danh tính theo Bí thư phụ trách đủ Khu phố tham gia **hoặc** có
grant đặc biệt theo session.

## MVP scope
Đăng nhập & phân quyền theo Khu phố · quản lý Khu phố/Bí thư/học sinh · tạo buổi (thường + chung) ·
điểm danh · xin phép nghỉ · thông báo in-app · xuất DOCX mẫu · import giấy tờ qua staging + duyệt tay.

## Ngoài phạm vi MVP
Offline sync hoàn toàn · web push/SMS quy mô lớn · OCR độ chính xác cao nhiều mẫu · workflow duyệt
nhiều cấp · dashboard BI nâng cao.
