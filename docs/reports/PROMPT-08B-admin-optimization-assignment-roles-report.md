# Báo cáo PROMPT 08B — Tối ưu Admin + Vai trò phụ trách + Rà soát câu chữ

- **Ngày:** 2026-07-07
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-08A-admin-control-center-report.md`
- **Phạm vi:** Tối ưu quản lý Khu phố (CRUD + số liệu, không hard-delete), phân công phụ trách
  có **vai trò rõ ràng** (Phụ trách chính / Phụ trách chung), tìm kiếm tài khoản Admin, rà soát
  câu chữ toàn hệ thống. **Không** render DOCX thật (để prompt sau); **không** phá Auth/RBAC/CRUD/
  Attendance/OCR/Notification/Admin 08A; **không** reset DB/drop/disable RLS/`using(true)`.

---

## A — Đọc lại trạng thái + audit guardrails (Phần A, yêu cầu 1–3)

Đọc `PROJECT_PROGRESS.md`, `IMPLEMENTATION_HISTORY.md`, `engineering-guardrails.md`, report 07/08A.
**Audit guardrails:** doc `engineering-guardrails.md` (4 nhóm) vẫn **ngắn gọn, đúng, đủ** — giữ nguyên,
không thêm mục thừa. 08B tiếp tục tuân thủ: service role chỉ cho auth user (không dùng ở 08B), mọi
read/write qua RLS, migration additive, test bằng client đăng nhập thật.

Rà soát 08A để **không làm trùng**: tài khoản/gán/khóa/reset/audit/notification đã có → 08B chỉ **bổ
sung chiều sâu** (số liệu Khu phố, vai trò phân công, tìm kiếm, câu chữ), không viết lại.

## B — Migration (additive)

| Migration | Loại | Nội dung |
| --- | --- | --- |
| `20260707030000_assignment_roles` | additive | `secretary_neighborhoods.assignment_role` (`PRIMARY`/`COORDINATING`, mặc định `COORDINATING`, CHECK) + **partial unique index** `uq_snb_one_primary_per_neighborhood` (tối đa 1 Phụ trách chính/Khu phố) |

- **Không** thêm/nới policy RLS: `sn_insert`/`sn_update` đã chỉ cho `is_admin()`; `sn_select` cho
  Admin + chính chủ. Cột mới nằm trong policy sẵn có.
- `db push` OK (áp remote). `gen types --linked` **thành công** (khác 08A — lần này có token) →
  `database.types.ts` sinh lại thật, có `assignment_role`.
- "Phụ trách chính/chung" là **assignment metadata**, KHÔNG phải role auth mới — cả hai vẫn `SECRETARY`.

## C — Tối ưu quản lý Khu phố (yêu cầu 4)

`/admin/neighborhoods` (trước: chỉ liệt kê read-only):
- **Danh sách thật** kèm số liệu: số học sinh, số cán bộ phụ trách, số buổi sinh hoạt, tên **Phụ
  trách chính**, trạng thái. Tổng hợp trong bộ nhớ (`listNeighborhoodsDetailed`) — tránh N+1.
- **Thêm** Khu phố (`createNeighborhood` — Zod validate mã/tên, bắt trùng mã 23505).
- **Sửa** mã/tên (`updateNeighborhood` — form ẩn trong `<details>`, không cần JS).
- **Ngừng/Kích hoạt lại** (`setNeighborhoodActive`) — **không hard-delete** (giữ lịch sử; `hasData`
  đánh dấu Khu phố có dữ liệu). Ghi audit từng thao tác.

## D — Vai trò phân công (yêu cầu 3, 5)

- **Phụ trách chính (PRIMARY):** tối đa **1**/Khu phố (partial unique index enforce ở DB).
- **Phụ trách chung/phối hợp (COORDINATING):** không giới hạn.
- Một Bí thư/Chi Đoàn có thể phụ trách **nhiều** Khu phố với vai trò khác nhau.
- **Server Actions** (`secretaries/actions.ts`): `assignNeighborhood(role)`, `setAssignmentRole`,
  `unassignNeighborhood`. Khi nâng ai đó lên **chính**, `demoteExistingPrimary` hạ người chính cũ
  xuống chung **trước** (tránh vi phạm unique index) → thao tác mượt, giữ ràng buộc.
- **Trang `/admin/assignments`** viết lại theo **góc nhìn Khu phố**: mỗi Khu phố hiển thị Phụ trách
  chính + danh sách phối hợp; nút "Đặt làm chính", "Chuyển thành phối hợp", "Gỡ", form "+ Phân công"
  (chọn cán bộ + vai trò).
- **Trang `/admin/secretaries`** hiển thị mỗi Khu phố kèm **nhãn vai trò**; form gán có chọn vai trò;
  chỉ cho gán vào Khu phố **đang hoạt động**.

## E — Tối ưu tài khoản Admin (yêu cầu 6)

- **Bí thư/Chi Đoàn:** nhãn chức danh rõ (`staff_title`); vai trò phụ trách hiển thị theo Khu phố.
- **Phụ huynh/Học sinh:** thêm nhãn "Phụ huynh"; danh sách học sinh liên kết rõ ràng.
- **Tìm kiếm** cả hai trang (GET form, `q` → `full_name`/`phone` `ilike` qua RLS), hiển thị số
  lượng khớp. Không JS phía client.

## F — Rà soát câu chữ (yêu cầu 7)

- Bỏ mọi chuỗi lộ **số prompt nội bộ** khỏi UI người dùng (templates, secretary/reports) → thay bằng
  "đang được hoàn thiện" / "sắp có".
- Thống nhất: "Đang hoạt động" / "Đã khóa" / "Ngừng hoạt động"; "Phân công phụ trách" (nav + tiêu đề
  khớp nhau); giảm jargon ("Vai trò SECRETARY" → "Cán bộ phụ trách").
- Mô tả trang Khu phố/Phân công/Secretaries/Parents viết lại cho rõ nghiệp vụ.
- Giữ nguyên chuỗi kỹ thuật trong **comment code** (tài liệu lịch sử) — chỉ sửa **chuỗi hiển thị**.

## G — Kiểm thử (yêu cầu 8–9)

| Bước | Kết quả |
| --- | --- |
| typecheck / lint / build | ✅ Pass (route `/admin/neighborhoods`, `/admin/assignments`… build OK) |
| **Smoke test RLS ký tên Admin thật** (không service role) | ✅ Xem dưới |

**Smoke (đăng nhập Admin thật qua publishable key):** tạo Khu phố → gán Phụ trách chính (assignment_role
=PRIMARY) → đọc lại = PRIMARY → đổi sang COORDINATING → đọc lại = COORDINATING → **dọn sạch** (DB về
trạng thái trước test). Tất cả OK. Ràng buộc "1 chính/Khu phố" do partial unique index enforce ở DB
(migration áp thành công). Script test **không commit** (tránh lưu mật khẩu demo).

## H — Tuân thủ quy tắc

- ✅ Không phá Auth/RBAC/CRUD/Attendance/Leave/OCR/Notification/Admin 08A.
- ✅ Không reset DB/drop/disable RLS/`using(true)`; migration **additive**; index partial unique.
- ✅ Không service role ở read/write 08B (đều qua RLS); không đổi role enum; Bí thư/Chi Đoàn chung quyền.
- ✅ "Xóa" Khu phố = ngừng hoạt động (không hard-delete dữ liệu có lịch sử).
- ✅ Vai trò phụ trách = assignment metadata, không phải role auth mới.
- ✅ Cập nhật progress/history/report; lỗi (nếu có) ghi rõ.

## I — Chưa làm (đúng phạm vi)

- Render DOCX thật + upload binary mẫu (giữ ở prompt sau).
- `/admin/students`, `/admin/reports`, `/admin/settings` giữ mức đọc/tối giản (ngoài scope 08B cốt lõi).
