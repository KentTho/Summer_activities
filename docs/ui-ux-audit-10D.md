# UI/UX Inventory Audit — Prompt 10D

> Rà soát giao diện Admin/User trước khi polish. Phạm vi 10D **chỉ nâng UI/UX**,
> KHÔNG đổi nghiệp vụ/route/Auth/RBAC/RLS/schema. Cột "Không xử lý" ghi việc để 10E/10F.

## Nguyên tắc chung phát hiện được (trước 10D)
- Nút chính không nhất quán: `Button` primary dùng `bg-slate-800`, nhưng nhiều trang
  tự viết `bg-indigo-600` inline → hai màu "primary" khác nhau.
- Chuỗi class input lặp lại ở từng trang (`h-10/h-11 rounded-lg border …`).
- Trạng thái rỗng viết rời rạc (`<p>Không có…</p>`) — không nhất quán.
- Thông báo lỗi/thành công mỗi nơi một kiểu (`bg-red-50`, `bg-amber-50`…).
- Focus ring không đồng bộ; một số action thiếu focus-visible rõ.
- Thiếu component dùng chung cho header có hành động, thẻ có tiêu đề+hành động, bảng cuộn.

## Nhóm Admin

| Trang | Vấn đề UI hiện tại | Mức độ | Cách xử lý 10D | Không xử lý |
|---|---|---|---|---|
| `/admin` | Quick-action là danh sách link chữ; nút primary lệch màu | Nhẹ | Button/PageHeader đồng bộ qua design system | Sắp xếp lại KPI nâng cao (10E) |
| `/admin/profile` | Form label/spacing tự viết | Nhẹ | `FormField`/`fieldClass` (đồng bộ qua shared) | — |
| `/admin/secretaries` | Search + list, empty rời rạc | TB | EmptyState/StatusBadge/fieldClass sẵn dùng | Sửa học sinh từ Admin (10E) |
| `/admin/parents` | Như secretaries | TB | Đồng bộ shared component | — |
| `/admin/neighborhoods` | Bảng số liệu, badge trạng thái | TB | StatusBadge/DataTableShell sẵn dùng | — |
| `/admin/assignments` | Vai trò chính/phối hợp cần badge rõ | TB | `StatusBadge` map `primary/coordinating` | — |
| `/admin/students` | Filter form inline; empty text; badge tự viết | TB | **Đã polish**: ActionBar không đổi logic, EmptyState, StatusBadge | Admin edit HS (10E) |
| `/admin/sessions` | Danh sách buổi read-only | Nhẹ | Badge/empty đồng bộ | — |
| `/admin/templates` | Upload mẫu + list | Nhẹ | InlineAlert/EmptyState sẵn dùng | — |
| `/admin/reports` | Nút xuất DOCX | Nhẹ | Button primary indigo đồng bộ | — |
| `/admin/settings` | Form lưu + feedback | TB | FormField/InlineAlert sẵn dùng | — |
| `/admin/audit` | Log dạng danh sách | Nhẹ | Spacing/empty đồng bộ | — |
| `/admin/notifications` | Form gửi + scope | TB | FormField/InlineAlert sẵn dùng | — |
| `/admin/password-requests` | Danh sách PENDING + resolve | TB | StatusBadge `pending/resolved` | — |

## Nhóm Bí thư / Chi Đoàn

| Trang | Vấn đề UI hiện tại | Mức độ | Cách xử lý 10D | Không xử lý |
|---|---|---|---|---|
| `/user/secretary` | Empty text rời rạc | TB | **Đã polish**: EmptyState cho "buổi hôm nay/sắp tới" | — |
| `/user/secretary/profile` | Form tự viết | Nhẹ | FormField/fieldClass | — |
| `/user/secretary/students` | Form nhập nhiều field + list | Cao | Form đồng bộ qua shared; StatusBadge active/deleted | — |
| `/user/secretary/sessions` | Tạo/dời/hủy/chốt buổi | TB | Button variant (danger cho hủy) + StatusBadge | — |
| `/user/secretary/attendance` | Roster + nút trạng thái mobile | Cao | Button/Badge đồng bộ; giữ nguyên logic | Tối ưu roster lớn (10F) |
| `/user/secretary/leave-requests` | Duyệt/từ chối | TB | Button primary/danger + StatusBadge | — |
| `/user/secretary/import` | "AI đọc — cần kiểm tra", field mới | Cao | InlineAlert warning + giữ cảnh báo hiện có | Ảnh gốc private (giữ) |
| `/user/secretary/reports` | Nút xuất DOCX + trạng thái mẫu | Nhẹ | Button indigo + StatusBadge | — |
| `/user/secretary/notifications` | unread/read | Nhẹ | Badge/empty đồng bộ | Realtime (10E) |

## Nhóm Phụ huynh / Học sinh

| Trang | Vấn đề UI hiện tại | Mức độ | Cách xử lý 10D | Không xử lý |
|---|---|---|---|---|
| `/user/parent` | Cảnh báo chưa liên kết = Card vàng tự viết; empty text | TB | **Đã polish**: InlineAlert warning + EmptyState | — |
| `/user/parent/profile` | Xem HS liên kết + hướng dẫn liên hệ Bí thư | Nhẹ | Card/Badge đồng bộ; giữ note không-sửa | Parent request-edit (10E) |
| `/user/parent/schedule` | Ngày/giờ/địa điểm/trạng thái | Nhẹ | Badge loại buổi đồng bộ | — |
| `/user/parent/attendance` | Lịch sử điểm danh | Nhẹ | StatusBadge/empty đồng bộ | — |
| `/user/parent/leave-requests` | Form xin nghỉ + trạng thái | TB | FormField/InlineAlert/StatusBadge | — |
| `/user/parent/notifications` | mark read | Nhẹ | Badge/empty đồng bộ | Realtime (10E) |

## Public / Auth

| Trang | Vấn đề UI hiện tại | Mức độ | Cách xử lý 10D | Không xử lý |
|---|---|---|---|---|
| `/` | OK (đã 10C); primary indigo | Nhẹ | Giữ; xác nhận KHÔNG link Admin | — |
| `/gioi-thieu` | OK (đã 10C bỏ link Admin) | Nhẹ | Giữ | — |
| `/user/login` | Label/field tự viết | TB | **Đã polish**: LoginForm dùng FormField/InlineAlert | — |
| `/admin/login` | Như user login; không forgot public | TB | **Đã polish** (qua LoginForm) | — |
| `/forgot-password` | Chỉ cổng User (đã 10C) | Nhẹ | Giữ; field đồng bộ | — |
| `/change-password` | Form đổi MK | Nhẹ | FormField/InlineAlert sẵn dùng | — |

## Ghi chú phạm vi
- "Đã polish" = trang đã chỉnh trực tiếp trong 10D.
- "Sẵn dùng / đồng bộ qua shared" = hưởng lợi tự động từ nâng cấp `Button`/`PageHeader`/
  `globals.css` (màu primary, focus, table spacing) mà **không** phải sửa từng dòng —
  giảm rủi ro regression. Component mới đã có sẵn để các trang này áp dần ở 10E khi chạm tới.
- Không đổi route, không đổi server action nghiệp vụ, không đổi RLS/schema.
