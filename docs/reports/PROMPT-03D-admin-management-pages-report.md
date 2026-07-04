# Báo cáo PROMPT 03D — Trang quản trị Admin + Cập nhật tiến độ

- **Ngày:** 2026-07-04
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-03C-user-portal-pages-progress-report.md`
- **Phạm vi:** hoàn thiện UI/UX các trang **quản trị Admin** bằng **mock data**.
  **Không** làm Auth/DB/CRUD/DOCX/upload/API thật.

---

## A — Hiện trạng trước khi làm

Admin mới có `/admin/login` + `/admin` (dashboard placeholder). User portal đã đủ
trang (03C). Mock data ở `src/lib/mock/` (student/session/leave/notification/import).
Tree sạch, đã đồng bộ `origin/main` sau 03C.

---

## B — Trang Admin đã tạo (10 route, group `admin/(portal)`)

| Route | Nội dung |
| --- | --- |
| `/admin` | KPI (Khu phố/Bí thư/Học sinh/Buổi) + thẻ **Cần xử lý** (Khu phố thiếu Bí thư, Bí thư chưa gán) + audit gần đây |
| `/admin/neighborhoods` | Danh sách Khu phố: trạng thái, số HS, số Bí thư; nút thêm/sửa (disabled) |
| `/admin/secretaries` | Tài khoản Bí thư: email/phone, Khu phố phụ trách, trạng thái; sửa/reset MK (disabled) |
| `/admin/assignments` | Gán Bí thư ↔ Khu phố theo từng Khu phố; nêu bật gap phân công |
| `/admin/students` | Tổng quan HS toàn hệ thống (chỉ xem) — phân bổ theo Khu phố |
| `/admin/sessions` | Tổng quan buổi sinh hoạt toàn hệ thống (chỉ xem) — buổi thường/chung |
| `/admin/templates` | Mẫu DOCX: tải lên (disabled), danh sách template, trạng thái dùng/ẩn |
| `/admin/reports` | Báo cáo tổng hợp hệ thống + nút "Xuất DOCX (chưa kết nối)" |
| `/admin/audit` | Audit log (append-only, chỉ xem) — actor/role/action/entity/detail |
| `/admin/settings` | Cấu hình an toàn — chỉ field whitelist (tên/logo/màu/footer) |

Mọi trang **mobile-first**, dùng chung `DashboardShell` (role ADMIN) + `SidebarNav`
active-state + banner **"UI demo · chưa kết nối dữ liệu"**; nút nghiệp vụ **disabled**
kèm chú thích "(chưa kết nối)".

---

## C — Mock data Admin (tách khỏi UI)

- Thêm view-model types vào `src/lib/mock/types.ts`: `AdminNeighborhood`,
  `MockSecretary`, `MockAuditLog`, `MockDocxTemplate`, `SystemSettings`.
- File mới `src/lib/mock/admin.ts` (dữ liệu **giả**): `ADMIN_NEIGHBORHOODS` (5),
  `SECRETARIES` (4), `DOCX_TEMPLATES` (3), `AUDIT_LOGS` (6), `SYSTEM_SETTINGS`,
  `ADMIN_STATS` (aggregate + gap phân công). Barrel `index.ts` re-export.
- Ngày/giờ để chuỗi tĩnh → tránh lệch SSR/hydration. Không dùng dữ liệu trẻ em thật.

---

## D — Navigation

`nav-config.ts` (ADMIN) mở rộng thành 10 mục theo site map: Tổng quan · Khu phố ·
Bí thư · Gán phụ trách · Học sinh · Buổi sinh hoạt · Mẫu báo cáo · Báo cáo ·
Audit log · Cấu hình. Route cũ (`/admin/secretaries`, `/admin/neighborhoods`,
`/admin/audit`, `/admin/settings`) **không gãy** — đều đã có trang thật.

---

## E — Kiểm tra chất lượng

| Bước | Kết quả |
| --- | --- |
| `npm run lint` | ✅ Pass |
| `npm run typecheck` | ✅ Pass |
| `npm run build` | ✅ Pass — **31 route** (10 route Admin mới) prerender static, + Proxy |

---

## F — Tuân thủ quy tắc

- ✅ Không Auth/DB/CRUD/DOCX/upload/API thật; nút nghiệp vụ disabled + nhãn rõ.
- ✅ Mock data **giả**, tách khỏi UI; không dữ liệu trẻ em thật.
- ✅ Không commit `.env.local`/`.next`/`node_modules`/secret; không service role ở client.
- ✅ Không tạo route dư thừa (mỗi route khớp một mục quản trị trong yêu cầu).
- ✅ Không sửa route cũ gây gãy; mobile-first; tái dùng primitive sẵn có.

---

## G — Tiến độ & Git

- `docs/PROJECT_PROGRESS.md`: Phase 4 → **Done (UI shell + mock)**; thêm checklist 03D.
- `docs/admin-management-pages.md`: site map + thiết kế quyền hạn Admin.
- Commit + push lên `origin/main` (xem lịch sử git).

## Chưa làm (đúng phạm vi 03D)

Auth thật · DB schema/RLS · CRUD · upload template · DOCX render · ghi audit thật ·
lưu cấu hình thật · notification thật. Để lại cho Prompt 04+.
