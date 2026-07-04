# Trang quản trị Admin (Admin management pages)

> Cập nhật ở Prompt 03D. **Trạng thái:** UI shell + mock data — **chưa** nối
> Auth/DB/CRUD/DOCX thật. Mọi nút nghiệp vụ đều disabled + nhãn "chưa kết nối".

## 1. Site map cổng Admin (`/admin/*`)

| Route | Mục đích |
| --- | --- |
| `/admin` | Tổng quan: KPI hệ thống, cảnh báo phân công, audit gần đây |
| `/admin/neighborhoods` | Quản lý Khu phố (trục phân quyền lõi) — trạng thái, số HS/Bí thư |
| `/admin/secretaries` | Quản lý tài khoản Bí thư (Admin tạo, khóa, reset mật khẩu) |
| `/admin/assignments` | Gán Bí thư ↔ Khu phố; nêu bật Khu phố thiếu Bí thư / Bí thư chưa gán |
| `/admin/students` | Tổng quan học sinh toàn hệ thống (chỉ xem, tổng hợp theo Khu phố) |
| `/admin/sessions` | Tổng quan buổi sinh hoạt toàn hệ thống (chỉ xem) |
| `/admin/templates` | Quản lý mẫu báo cáo DOCX (chỉ `.docx`, chặn macro) |
| `/admin/reports` | Báo cáo tổng hợp cấp hệ thống (xuất DOCX ở phase sau) |
| `/admin/audit` | Xem audit log (append-only, không sửa/xóa từ UI) |
| `/admin/settings` | Cấu hình hệ thống an toàn (chỉ field whitelist) |

Tất cả nằm trong route group `admin/(portal)` → dùng chung `DashboardShell`
(role ADMIN) với top bar + `SidebarNav` active-state + nhãn "UI demo".
Trang `/admin/login` vẫn ở `admin/(auth)` (tách chrome).

## 2. Ranh giới quyền hạn (thiết kế)

- **Admin = quản trị toàn hệ thống:** Khu phố, Bí thư, gán phụ trách, template,
  cấu hình, audit, báo cáo tổng hợp.
- **Không** trực tiếp CRUD học sinh: nghiệp vụ này thuộc Bí thư trong phạm vi
  Khu phố (RLS chặn ở phase DB). Trang `/admin/students` & `/admin/sessions` chỉ
  **xem tổng quan**.
- Audit log **append-only**; cấu hình chỉ **field whitelist** (không nhập CSS/JS/HTML).

## 3. Mock data (tách khỏi UI)

`src/lib/mock/admin.ts` (+ types ở `types.ts`) — dữ liệu **giả**:
`ADMIN_NEIGHBORHOODS` (5 Khu phố), `SECRETARIES` (4), `DOCX_TEMPLATES` (3),
`AUDIT_LOGS` (6), `SYSTEM_SETTINGS`, và `ADMIN_STATS` (aggregate cho dashboard,
gồm danh sách Khu phố thiếu Bí thư / Bí thư chưa gán).

Khi nối DB thật: thay lớp mock bằng truy vấn Admin qua RLS; UI giữ nguyên nhờ
dùng chung view-model types.

## 4. Chưa làm (đúng phạm vi 03D)

Auth thật · DB schema/RLS · CRUD Khu phố/Bí thư/gán · upload template thật ·
DOCX render · ghi audit thật · lưu cấu hình thật · gọi API.
