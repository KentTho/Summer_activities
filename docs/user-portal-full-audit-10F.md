# User Portal full audit — 10F

Cột "Fix trong 10F" = đã xử lý; "Backlog" = ghi nhận, làm sau.

| Trang | Vai trò | Vấn đề trước | Dư bước? | Khoảng trống desktop? | Fix 10F | Backlog |
|---|---|---|---|---|---|---|
| `/user/secretary` | BT | Card link tới trang đã bị gộp | Không lớn | Vừa | ✅ link → `/operations`; container 7xl | Dashboard dense hơn (KPI/quick-action) |
| `/user/secretary/students` | BT | Sau lưu chỉ text nhỏ | Ít | Vừa | ✅ toast thêm/sửa | ActionBar/DataTableShell + side panel form |
| `/user/secretary/sessions` | BT | Nhãn chỉ mở/chốt; không phân biệt hủy/đã qua | Không | Vừa | ✅ badge hủy/đã qua + Khu phố badge + label link đúng | — |
| `/user/secretary/sessions/[id]` | BT | Nút Dừng/Hủy/Dời hiện cả khi vô lý; buổi chung không chọn Khu phố | Có | Có (đã cải ở 10E) | ✅ ẩn nút theo trạng thái + selector Khu phố + đếm theo Khu phố; notify ẩn khi hủy | Timeline theo Khu phố |
| `/user/secretary/attendance` | BT | **Trùng** chi tiết buổi (nav lặp) | Có | — | ✅ bỏ khỏi sidebar + redirect `/sessions` | — |
| `/user/secretary/leave-requests` | BT | Duyệt/từ chối không feedback; nav rời | Có | Vừa | ✅ gộp vào `/operations` tab; toast; filter chờ/tất cả | — |
| `/user/secretary/notifications` | BT | Chỉ list đã gửi + hint; nav rời | Có | Vừa | ✅ gộp vào `/operations` tab + composer chọn buổi gửi | — |
| `/user/secretary/import` | BT | Feedback inline nhỏ | Ít | Vừa | ✅ toast AI extract + lưu dòng | ActionBar/DataTableShell dày hơn |
| `/user/secretary/reports` | BT | Xuất DOCX qua route | Không | Vừa | (giữ) | Loading state khi xuất |
| `/user/secretary/profile` | BT | Sau lưu chỉ text | Ít | 1 cột | ✅ toast lưu hồ sơ | Layout 2 cột dày |
| `/user/parent` | PH | — | Không | Vừa | (giữ) | Dashboard timeline |
| `/user/parent/schedule` | PH | — | Không | Vừa | (giữ) | Timeline/card |
| `/user/parent/attendance` | PH | — | Không | Vừa | (giữ) | — |
| `/user/parent/leave-requests` | PH | — | Không | Vừa | (giữ) | — |
| `/user/parent/notifications` | PH | mark-read đã có | Không | Vừa | (giữ) | Realtime (10H) |
| `/user/parent/profile` | PH | Chỉ xem HS liên kết | Không | Vừa | ✅ toast lưu (ProfileForm dùng chung) | Request-edit (10H) |

## Kết luận
- **Structural fixes (làm trong 10F):** nav gộp + route compat + session action logic
  + joint-neighborhood selector + operations page + session detail width/badges.
- **Feedback coverage:** toast cho điểm danh, điều khiển buổi, thông báo, đơn xin
  nghỉ, học sinh, import, hồ sơ.
- **Light-touch (chưa full redesign):** dashboard, students table shell, import table
  shell, reports loading, parent timeline → **backlog** (không dồn hết vào 10F để
  tránh rủi ro; ưu tiên structural + feedback trước).
