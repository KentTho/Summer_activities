# Báo cáo PROMPT 08C — Audit ID + DOCX export thật + Hardening Admin + Next-step reporting

- **Ngày:** 2026-07-07
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-08B-admin-optimization-assignment-roles-report.md`
- **Phạm vi:** Audit ID toàn DB · upload mẫu DOCX thật (Storage private) · render DOCX export thật
  (Bí thư/Chi Đoàn + Admin) · hardening `/admin/students`,`/admin/reports`,`/admin/settings` ·
  cập nhật `/api/health` · rà soát toàn dự án · docs/report.
- **Không** phá Auth/RBAC/CRUD/OCR/Attendance/Leave/Notification/Admin 08A-08B; **không** reset DB/
  drop/disable RLS/`using(true)`; **không** render DOCX ở client; **không** public URL tệp học sinh.

---

## A — Đọc lại trạng thái (Phần A)

Đọc `PROJECT_PROGRESS.md`, `IMPLEMENTATION_HISTORY.md`, `engineering-guardrails.md`, report 07/08A/08B,
`docx-export.md`, `security.md`, `package.json`, `.env.example`; liệt kê cây `src/app`, `src/lib`,
`src/modules`, `supabase/migrations`. `migration list --linked`: **10 migration khớp local↔remote**
(DB đồng bộ) → audit ID dựa trên DDL đã áp là chuẩn xác.

## B — Audit ID toàn database (yêu cầu 2 + câu hỏi user)

**Câu hỏi user:** "các bảng có `id` có thể để tự động không?" → **Trả lời: ID đã tự động sẵn.**

| Nhóm bảng | `id` | Kết luận |
| --- | --- | --- |
| Bảng nghiệp vụ (profiles, neighborhoods, guardians, students, activity_sessions, attendance_records, leave_requests, notifications, uploaded_documents, import_batches, import_batch_rows, export_templates, audit_logs, …) | `uuid primary key default gen_random_uuid()` | ✅ Tự sinh — không cần sửa |
| Bảng liên kết (secretary_neighborhoods, student_guardians, session_neighborhoods, session_permissions, notification_recipients) | `id uuid` tự sinh **+** `unique(...)` composite | ✅ Đúng — KHÔNG thêm/bỏ id bừa |
| `system_settings` | `id boolean default true` + CHECK `id = true` | ✅ Singleton **có chủ đích** — giữ nguyên |

→ **Không cần migration ở 08C.** Không bảng nghiệp vụ nào có `id` mà chưa tự sinh.

## C — Bộ ghi DOCX zero-dependency (yêu cầu 3–4)

- `src/lib/docx/zip.ts`: ghi ZIP **STORE** (không nén) + **CRC-32** tự cài; đầu ra **tất định**
  (không dùng đồng hồ). Word/LibreOffice mở được ZIP STORE.
- `src/lib/docx/document.ts`: sinh **OOXML WordprocessingML** tối giản (3 phần bắt buộc; bảng dùng
  `tblBorders` inline nên **không cần** `styles.xml`). Escape XML + strip ký tự điều khiển + UTF-8
  (giữ dấu tiếng Việt). `renderDocx(blocks) → Buffer`, **server-side only**.
- **Lý do tự cài thay vì thư viện:** giữ dự án nhỏ, không phụ thuộc package bên thứ ba cho định dạng
  nhạy cảm; đáp ứng guardrail "MVP đơn giản nhưng chạy thật, không làm giả".
- **Tự test:** render tệp mẫu → mở lại bằng `System.IO.Compression` → thấy đủ 3 phần, `word/document.xml`
  chứa tiếng Việt + escape `&amp; &lt;test&gt;` đúng.

## D — Upload mẫu DOCX thật vào Storage private (yêu cầu 3)

- Bucket **private** `report-templates` (`src/lib/storage/templates.ts#ensureTemplateBucket`, idempotent,
  `public:false`, giới hạn 10MB + mime `.docx`). Upload/download/… bằng **service role** — **chỉ sau
  `requireAdmin()`** (guardrail: service role chỉ khi bắt buộc, sau xác thực Admin).
- `templates/actions.ts#createTemplate`: nhận `File` → `checkTemplateUploadFile` kiểm **nhiều lớp**:
  đuôi `.docx` (chặn `.docm`), mime whitelist, **magic bytes ZIP** (`50 4B 03 04`), **quét chuỗi macro**
  (`vbaProject`/`macroEnabled` trong nội dung ZIP), ≤10MB → upload binary → ghi `uploaded_documents`
  (bucket/path/mime/size/**sha256**) + `export_templates.document_id` **qua RLS** (client Admin đăng nhập).
- Tải lại (Admin): route `admin/templates/[templateId]/download` — xác thực ADMIN, service role đọc binary,
  trả **attachment** (không public URL). Ghi audit `DOWNLOAD_TEMPLATE`.
- **Tự test storage thật:** create bucket (private) → upload → download (14 bytes) → remove → OK.

## E — DOCX export thật cho Bí thư/Chi Đoàn + Admin (yêu cầu 4–5)

- Dữ liệu **qua RLS** (`src/lib/data/reports.ts`): `getStudentReport` (HS trong phạm vi + tên Khu phố),
  `getAttendanceReport` (roster + tổng hợp Có mặt/Có phép/Không phép/Chưa điểm danh). Dựng `DocBlock[]`
  ở `src/lib/reports/blocks.ts` (hàm thuần, dễ test).
- **Route handlers tự xác thực vai trò** (route KHÔNG chạy qua layout guard):
  - `GET /user/secretary/reports/students` — DS học sinh (SECRETARY/ADMIN).
  - `GET /user/secretary/reports/attendance?session=<uuid>` — điểm danh 1 buổi (RLS chặn buổi ngoài phạm vi → 404).
  - `GET /admin/reports/system` — báo cáo tổng hợp (chỉ ADMIN).
- Mỗi lần xuất ghi audit `EXPORT_DOCX` (**không** log PII học sinh/phụ huynh). Tên tệp chuẩn hóa
  (chống header injection). Trang `secretary/reports` nay có **nút xuất thật** + danh sách buổi để xuất.

## F — Hardening Admin (yêu cầu 5)

- **`/admin/students`**: đọc thật toàn hệ thống (RLS `is_admin`) + **tìm tên** + **lọc Khu phố/trạng thái**
  (`listAllStudents`, giới hạn 500, có nhãn khi chạm trần). Vẫn **chỉ đọc** (CRUD thuộc cổng Bí thư).
- **`/admin/reports`**: **số liệu thật** (`getAdminOverview` + `listNeighborhoodsDetailed`) + nút **xuất DOCX**
  tổng hợp + thống kê theo Khu phố.
- **`/admin/settings`**: **lưu thật** `system_settings` (single row, upsert `onConflict:id`) qua action
  `saveSettings` (`requireAdmin`) — **whitelist** `system_name`/`primary_color`(hex)/`public_footer_text`;
  từ chối màu không hợp lệ; **không** nhận CSS/JS/HTML; ghi audit `UPDATE_SETTINGS`.

## G — Health + rà soát dự án (yêu cầu 6–7)

- `/api/health.phase`: `5-db-schema-rls` → **`08c-docx-export-admin-hardening`**.
- Rà soát: **không còn** trang import `@/lib/mock`; **không còn** `DemoNotice` trong `src/app`; các nút
  "chưa kết nối/sắp có" đã thay bằng hành động thật. Không thấy TODO/FIXME chặn. `src/lib/mock/*` nay
  **không ai import** (dead code — đề xuất dọn ở prompt sau, không làm ngay để tránh lan man).

## H — Kiểm thử (yêu cầu 8, 10)

| Bước | Kết quả |
| --- | --- |
| typecheck / lint / build | ✅ Pass (đủ route mới: 3 route export DOCX + route tải mẫu) |
| DOCX writer self-test (mở lại ZIP + đọc XML) | ✅ Pass |
| Storage self-test (create private → upload → download → remove) | ✅ Pass |
| **Smoke RLS ký tên Admin thật** (publishable key, KHÔNG service role) | ✅ Đọc HS · upsert settings · insert template+doc → **dọn sạch** |

Script test **không commit** (tránh lưu mật khẩu demo).

## I — Tuân thủ quy tắc

- ✅ Không phá Auth/RBAC/CRUD/OCR/Attendance/Leave/Notification/Admin 08A-08B.
- ✅ Không reset DB/drop/disable RLS/`using(true)`; **08C không cần migration** (audit ID: không có gì phải sửa).
- ✅ DOCX **render server-side**; mẫu **chỉ `.docx`** (chặn `.docm`/macro nhiều lớp); Storage **private**.
- ✅ Service role **chỉ** chạm binary Storage **sau `requireAdmin()`**; mọi metadata/read nghiệp vụ qua RLS.
- ✅ Không log PII học sinh/phụ huynh; không public URL tệp báo cáo/mẫu.

---

## J — GỢI Ý BƯỚC TIẾP THEO (bắt buộc từ 08C)

### J.1. Gợi ý bước tiếp theo (ưu tiên)
1. **Placeholder-merge vào mẫu upload**: đọc `word/document.xml` của mẫu `.docx`, thay `{{ten_khu_pho}}`,
   `{{danh_sach}}`, `{{ngay}}`… bằng dữ liệu RLS → xuất đúng mẫu in cấp trên. (Cần bộ **đọc** ZIP —
   bổ sung `unzip` tối giản cạnh `zip.ts`.)
2. **Trang tải báo cáo cho Admin theo Khu phố/khoảng ngày** (chọn phạm vi rồi xuất) — mở rộng từ
   `admin/reports/system`.
3. **Set env production**: thêm `OCR_SPACE_API_KEY` (server) trên Vercel nếu muốn OCR chạy trên prod
   (không `NEXT_PUBLIC_`). DOCX/Storage đã chạy chỉ cần `SUPABASE_SERVICE_ROLE_KEY` (đã có).

### J.2. Các điểm dự án cần tu sửa thêm
- **Dọn `src/lib/mock/*`** (dead code — không ai import) + type liên quan.
- **Bắt đổi mật khẩu lần đầu**: cờ `must_change_password` đã có nhưng chưa có UI ép đổi.
- **Lưu ảnh gốc OCR + audit** vào bucket private (hiện OCR không giữ ảnh).
- **Chỉ số/giao diện**: `/admin/students` mới dạng danh sách phẳng — cân nhắc phân trang khi >500 HS.
- **`config.toml major_version=15` (local) vs remote 17** — chỉ ảnh hưởng dev local; canh chỉnh khi tiện.

### J.3. Những việc KHÔNG nên làm ngay (tránh lan man)
- **Không** viết engine template DOCX đầy đủ (điều kiện/vòng lặp/ảnh) — MVP merge placeholder là đủ trước.
- **Không** đổi bộ ghi DOCX sang thư viện nặng khi bản zero-dependency đang chạy tốt.
- **Không** thêm CRUD học sinh ở cổng Admin (đã thuộc cổng Bí thư — tránh trùng quyền/nghiệp vụ).
- **Không** mở public URL cho bucket `report-templates` (giữ private + route attachment).
- **Không** refactor lớn UI/kiến trúc trong cùng prompt tính năng.
