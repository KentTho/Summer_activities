# Báo cáo PROMPT 06B — Bootstrap accounts + OCR import staging + Security/DevOps notes

- **Ngày:** 2026-07-06
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-06A-secretary-crud-import-dashboard-report.md`
- **Phạm vi:** xác nhận DB sau reset, chạy/xác minh bootstrap 2 tài khoản, test login thật,
  tích hợp **OCR server-side** (OCR.space) theo hướng staging-first + duyệt tay, cập nhật docs
  security/session/JWT + DevOps rollback/backup + AI security checklist.
  **Không** Attendance/DOCX/Notification thật; **không** nâng cấp UI lớn; **không** reset/seed
  production; **không** đổi/nới RLS.

---

## A — Trạng thái sau reset (Phần A + kiểm DB)

- `git status` sạch; đọc lại `PROJECT_PROGRESS.md`, `IMPLEMENTATION_HISTORY.md`, report 05/06A,
  `ocr-import.md`, `security.md`.
- `.env.local` (kiểm không in giá trị): có `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, **`SUPABASE_SERVICE_ROLE_KEY` (đã có)**.
- Kiểm remote (service role, chỉ đếm): `profiles=2`, `neighborhoods=1`,
  `secretary_neighborhoods=1`, `students=0`, `import_batches=0`, `import_batch_rows=0`,
  `auth users=2` (`admin@…`, `0932077136@…`). → DB sạch, **bootstrap đã áp** trước đó.

## B — Bootstrap + test login (yêu cầu 1–4)

- Tài khoản đúng yêu cầu đã tồn tại (idempotent, tạo bởi `scripts/bootstrap-auth-users.mjs`):
  | Tài khoản | Mật khẩu | Role |
  | --- | --- | --- |
  | `Admin` | `admin@123` | ADMIN |
  | `0932077136` | `tho@123` | SECRETARY |
- **Test login thật** (publishable key, `identifierToEmail` như app):
  - `Admin` → OK, `role=ADMIN`, `full_name=Quản trị viên`.
  - `0932077136` → OK, `role=SECRETARY`, `full_name=Bí thư Thọ`.
- **Khuyến nghị:** bắt đổi mật khẩu sau đăng nhập đầu (đã đặt cờ `must_change_password`).

## C — OCR import server-side (yêu cầu 5–6)

Module mới `src/lib/ocr/` (server-only, đặt sau interface để thay provider):

| File | Vai trò |
| --- | --- |
| `types.ts` | `OcrProvider`, `OcrInput/OcrResult`, `ParsedStudentRow` |
| `ocrspace.ts` | Adapter **OCR.space Free API**; key từ env server; `base64Image`, `language=vie`, engine 1; xử lý cả lỗi `{error,details}` và `IsErroredOnProcessing` |
| `parse.ts` | Heuristic VN: tách SĐT (`+84`→`0`), ngày (`d/m/y`→`YYYY-MM-DD`), tên; bỏ STT + dòng tiêu đề |
| `index.ts` | `getOcrProvider()`, `extractStudentsFromImage()`, `hasOcrConfigured()` |

**Flow (staging-first, không auto-import)** — `import/[batchId]`:
1. `OcrUploadForm` → Server Action **`ocrExtractRows`**: validate file → OCR **trên server**
   → parse → chèn `import_batch_rows` với **`reviewed=false`**; đánh dấu lô `source=OCR`.
   **KHÔNG** tạo học sinh.
2. `EditableRow` (nhãn *"AI đọc — cần kiểm tra"*) → **`updateRow`**: sửa + đặt `reviewed=true`.
3. **`confirmBatch`**: **chỉ tạo `students` từ dòng `reviewed=true`** (bỏ qua dòng chưa duyệt),
   gán Khu phố theo lô, đánh dấu `created_student_id`; đóng lô `COMMITTED` **khi hết dòng chờ**.

→ Đáp ứng: OCR server-side · key không ở client · không auto-import · OCR chỉ tạo staging rows ·
duyệt/sửa tay · confirm mới tạo HS.

**Provider ưu tiên:** OCR.space (free). Google Vision / Gemini để sau (đã ghi ở `ocr-import.md`).

## D — Cấu hình, bảo mật file & secret (yêu cầu 5)

- `env.ts`: `OCR_PROVIDER` (mặc định `ocrspace`), `OCR_SPACE_API_KEY` (server-only, backward-compat
  `OCR_PROVIDER_KEY`), `OCR_SPACE_API_URL/LANGUAGE/ENGINE`, `hasOcrConfigured()`.
- `security/index.ts`: `checkOcrUploadFile()` — bắt buộc file, mime whitelist (JPG/PNG/WebP/PDF),
  **≤ 1MB** (khớp giới hạn free OCR.space, fail-fast, chống DoS).
- `next.config.ts`: `experimental.serverActions.bodySizeLimit = '2mb'` (ảnh multipart > 1MB mặc định).
- **Sự cố bảo mật đã xử lý:** người dùng đặt **key OCR thật trong `.env.example`** (file được
  commit → rò rỉ). Đã **chuyển key sang `.env.local`** (gitignored, không in giá trị ra log) và
  đưa `.env.example` về **placeholder rỗng** kèm cảnh báo không điền key thật vào file mẫu.

## E — Docs (yêu cầu 7)

- **Rewrite** `docs/ocr-import.md` — sơ đồ flow đã triển khai + vị trí mã + ranh giới an toàn.
- **Bổ sung** `docs/security.md` — mục **Session/Auth/JWT** (getUser vs getSession, cookie HttpOnly,
  service role chỉ server, xoay phiên) + trỏ AI checklist + cảnh báo key trong `.env.example`.
- **Mới** `docs/devops-deploy-rollback-backup.md` — pipeline, **Vercel instant rollback**,
  `git revert`, migration additive, backup/PITR Supabase, checklist release.
- **Mới** `docs/ai-security-checklist.md` — key server-only, human-in-the-loop, untrusted input,
  prompt-injection (khi dùng LLM), tối thiểu hóa PII, không log ảnh/PII.

## F — Kiểm tra chất lượng (yêu cầu 10)

| Bước | Kết quả |
| --- | --- |
| `npm run typecheck` | ✅ Pass |
| `npm run lint` | ✅ Pass |
| `npm run build` | ✅ Pass (route `/user/secretary/import/[batchId]`) |
| Login 2 tài khoản (script) | ✅ Admin=ADMIN, 0932077136=SECRETARY |
| OCR.space auth/connectivity | ✅ Key xác thực (endpoint xử lý ảnh, trả lỗi nội dung khi ảnh hỏng) |
| Parser VN (sample nhiều định dạng) | ✅ Tách đúng tên/ngày/SĐT, bỏ tiêu đề, chuẩn hóa |

**Sự cố kỹ thuật đã xử lý:** `EditableRow` (client) lỡ import `@/lib/data/imports` (kéo
`next/headers` server vào client → build fail). Đã sửa **đúng gốc**: truyền dữ liệu dòng dạng
plain props từ server page, bỏ import module server khỏi client component.

## G — Deploy (yêu cầu 11)

- Xem mục "Deploy" ở cuối phiên. OCR trên **production cần thêm `OCR_SPACE_API_KEY`** vào env
  server của Vercel (không `NEXT_PUBLIC_`); thiếu key → nút OCR vô hiệu, vẫn nhập tay được.

## H — Tuân thủ quy tắc

- ✅ Không Attendance/DOCX/Notification thật; không nâng cấp UI lớn; không phá CRUD 06A / Auth 05.
- ✅ Không reset remote DB; không seed production; không drop table; không disable/nới RLS.
- ✅ OCR **chỉ gọi từ server action**; key OCR/service role **không** ra client.
- ✅ Ảnh không auto-import; OCR chỉ tạo `import_batch_rows`; confirm mới tạo HS; sửa tay trước confirm.
- ✅ Không commit `.env.local`/`.vercel/`/`supabase/.temp`/secret/OCR key (đã move key + gitignore).
- ✅ Mọi lỗi chẩn đoán & sửa gốc, ghi vào report; cập nhật progress/history.
