# User Portal navigation map (10F)

## Sidebar Bí thư (SECRETARY) — sau 10F
| Mục | Route | Ghi chú |
|---|---|---|
| Tổng quan | `/user/secretary` | command center |
| Học sinh | `/user/secretary/students` | CRUD (qua RLS) |
| Buổi sinh hoạt | `/user/secretary/sessions` | **hub** tạo buổi + vào điểm danh từng buổi |
| Đơn & thông báo | `/user/secretary/operations` | 2 tab: Đơn xin nghỉ · Thông báo phụ huynh |
| Nhập giấy tờ | `/user/secretary/import` | AI/nhập tay staging |
| Báo cáo | `/user/secretary/reports` | xuất DOCX |
| Thông tin cá nhân | `/user/secretary/profile` | tự cập nhật họ tên/SĐT |

Bỏ so với trước: **"Điểm danh"** (trùng chi tiết buổi) và **"Thông báo"** riêng
(gộp vào Vận hành). Từ 9 mục → 7 mục.

## Route compatibility (không 404)
| Route cũ | Hành vi 10F |
|---|---|
| `/user/secretary/attendance` | → redirect `/user/secretary/sessions` |
| `/user/secretary/leave-requests` | → redirect `/user/secretary/operations?tab=leave` |
| `/user/secretary/notifications` | → redirect `/user/secretary/operations?tab=notifications` |

Server action `acknowledgeLeave`/`rejectLeave`/`notifySessionParents` giữ nguyên
(chỉ đổi chữ ký để trả trạng thái toast); RLS không đổi.

## Sidebar Phụ huynh (PARENT) — giữ nguyên cấu trúc
| Mục | Route |
|---|---|
| Tổng quan | `/user/parent` |
| Lịch sinh hoạt | `/user/parent/schedule` |
| Lịch sử điểm danh | `/user/parent/attendance` |
| Xin phép nghỉ | `/user/parent/leave-requests` |
| Thông báo | `/user/parent/notifications` (badge chưa đọc) |
| Thông tin cá nhân | `/user/parent/profile` |

## Badge chưa đọc
`SidebarNav` hiện badge ở mục kết thúc bằng `/notifications` (Parent) hoặc
`/operations` (Secretary) khi `unreadCount > 0`.

## Admin sidebar
**Không đổi trong 10F** (Admin refactor thuộc 10G).
