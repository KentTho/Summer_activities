# User Portal redesign principles (10F)

Nguyên tắc UI/UX áp dụng cho đợt refactor User Portal (không có skill package trong
repo → áp dụng trực tiếp). Design dials: DESIGN_VARIANCE 4/10 · MOTION_INTENSITY
3/10 · VISUAL_DENSITY 7/10. Style: enterprise dashboard, indigo/slate, clean.

## Nguyên tắc
1. **Dense, không lãng phí desktop** — container `max-w-7xl`; split-pane 2 cột cho
   trang thao tác (buổi/điểm danh); grid nhiều cột cho dashboard.
2. **Một chức năng = một nơi** — không điều hướng lặp (bỏ "Điểm danh" trùng "Buổi
   sinh hoạt"; gộp "Đơn xin nghỉ" + "Thông báo" thành "Đơn & thông báo").
3. **Sticky action rail** — điều khiển buổi + gửi thông báo ở cột phải dính khi cuộn.
4. **Compact roster/table** — danh sách cuộn riêng (`max-h`), row gọn, action rõ.
5. **No fake / no illogical buttons** — chỉ hiện nút hợp trạng thái (đã chốt/hủy/đã
   qua ẩn nút vô nghĩa) + giải thích khi ẩn.
6. **Feedback rõ, không spam** — toast góc phải (tối đa 3), aria-live; không reload
   nếu xử lý client-side an toàn được.
7. **Motion nhẹ** — chỉ transition màu/hover; không animation nặng.
8. **Anti-slop** — không card rỗng lớn, không khoảng trắng thừa, không jargon số prompt.
9. **Hierarchy rõ** — PageHeader (title + mô tả), badge trạng thái, metadata gọn.
10. **RLS/nghiệp vụ bất biến** — UI chỉ là lớp trải nghiệm; server action + RLS guard cuối.

## Áp dụng cụ thể (10F)
- Sidebar Bí thư gọn còn 7 mục (từ 9).
- Chi tiết buổi: header + summary + split-pane (roster 2/3 · rail 1/3).
- Buổi chung: badge Khu phố + selector Khu phố + bộ đếm theo Khu phố/tổng.
- Trang Vận hành: 2 tab (đơn / thông báo) thay 2 trang rời.
- Toast phủ: điểm danh, điều khiển buổi, gửi thông báo, đơn xin nghỉ, học sinh,
  import (AI/lưu dòng), hồ sơ cá nhân.
