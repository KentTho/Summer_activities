# Tách cổng Admin / User (Portal Separation) — 10C

## Quyết định sản phẩm + bảo mật UX
- Trang công khai (`/`, `/gioi-thieu`) và cổng Người dùng (`/user/login`, `/forgot-password`) **KHÔNG** hiển
  thị link/nút tới Quản trị.
- **Admin truy cập riêng** qua `/admin` (hoặc `/admin/login`) — tự gõ URL/bookmark, không quảng bá trên UI người dùng.
- Landing/giới thiệu chỉ ghi câu mô tả **không-link**: "Cổng quản trị dành cho người được phân quyền và truy
  cập riêng theo đường dẫn quản trị."
- `/forgot-password` chỉ phục vụ **Người dùng** (Bí thư/Phụ huynh). Admin dùng khôi phục break-glass máy chủ
  (`docs/admin-access-recovery.md`) — không có option "Quản trị viên" ở form công khai.

## Đây KHÔNG phải lớp bảo mật thay thế
Ẩn link chỉ **giảm bề mặt/nhiễu** cho người dùng thường. Bảo mật thật vẫn là:
- **Auth** (Supabase) + **RBAC** (layout guard theo vai trò) + **RLS** deny-by-default ở Postgres.
- Admin vẫn phải đăng nhập `/admin/login`; sai vai trò → redirect; RLS chặn dữ liệu.
- `/admin` chưa đăng nhập → redirect `/admin/login`; `/user/secretary` chưa đăng nhập → `/user/login`.

## Kiểm chứng
`npm run smoke:portal-separation` (mặc định production): `/` và `/gioi-thieu` và `/user/login` không chứa link
`/admin`; `/admin/login` vẫn 200; `/admin` & `/user/secretary` chưa login → redirect đúng cổng.

## Nội bộ Admin
Trong cổng Admin, nav vẫn link tới các route `/admin/*` (bình thường). `ROLE_LOGIN_HREF.ADMIN='/admin/login'`
chỉ dùng cho nút Đăng xuất trong shell Admin — không xuất hiện ở cổng người dùng.
