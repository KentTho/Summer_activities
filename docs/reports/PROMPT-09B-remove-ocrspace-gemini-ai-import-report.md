# Báo cáo PROMPT 09B — Bỏ OCR.space + Gemini AI Import + Monitoring nhẹ

- **Ngày:** 2026-07-07
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-09A-production-hardening-playbook-report.md`

## 1. Mục tiêu
Bỏ **hoàn toàn** OCR.space; chuyển import ảnh sang **Gemini Vision** (server-side, JSON schema chặt),
giữ nguyên staging bắt buộc (duyệt tay → confirm mới tạo học sinh); thêm monitoring nhẹ; cập nhật
health/preflight/docs. **Không** phá Auth/RBAC/RLS/CRUD/Attendance/Leave/Notification/DOCX;
**không** đưa key ra client/git; **không** auto-import.

## 2. Hiện trạng trước
Import dùng **OCR.space** (server-side) → text thô → parser VN → dòng nháp → duyệt tay → confirm.
Key `OCR_SPACE_API_KEY`. Health phase `09a-production-hardening`.

## 3. OCR.space removal audit
- Xóa code: `src/lib/ocr/{index,ocrspace,parse,types}.ts` (git rm).
- Env: `env.ts` bỏ `ocrProvider/ocrSpaceApiKey/…` + `hasOcrConfigured`; `.env.example` bỏ khối `OCR_*`.
- Security: `checkOcrUploadFile`/`MAX_OCR_UPLOAD_BYTES`/`ALLOWED_IMPORT_MIME` → `checkAiImportFile`/
  `ALLOWED_AI_IMPORT_MIME`.
- UI copy "OCR" → "AI đọc ảnh" (batch page, import list, CreateBatchForm, EditableRow, form mới).
- Docs: xóa `ocr-production-setup.md`; `ocr-import.md` gắn nhãn **lịch sử**; cập nhật
  `security.md`/`ai-security-checklist.md`/`ai-code-security-gate.md`/`production-readiness-playbook.md`.
- **Còn "OCR" ở đâu (có chủ đích):** enum DB `import_source = OCR|MANUAL` (không đổi schema) +
  `database.types.ts` (sinh từ DB) + bản ghi lịch sử 06B trong history/report cũ (bất biến). Không còn
  chuỗi "OCR.space" trong code/active-config/UI.

## 4. Gemini integration
`src/lib/ai-import/`:
- `gemini.ts`: `fetch` REST `…/v1beta/models/{model}:generateContent` (header `x-goog-api-key`,
  `responseMimeType:application/json`, temperature 0, timeout 30s). Xử lý 429=quota, blockReason,
  strip code fence. **Server-only**, không log key/ảnh/base64.
- `normalize.ts`: SĐT VN `+84/84→0`; ngày ISO/`d-m-y`→`YYYY-MM-DD` (validate năm 1990–2100);
  `computeNeedsReview` (thiếu tên / thiếu cả ngày+SĐT / confidence < 0.6).
- `index.ts`: **Zod schema nghiêm ngặt** cho JSON `{rows:[{full_name,birth_date,guardian_phone,confidence,
  notes}],warnings:[]}` → chuẩn hóa → `needs_review`.
- Env: `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-2.5-flash`, `GEMINI_API_BASE_URL`, `AI_IMPORT_MAX_FILE_MB=4`,
  `AI_IMPORT_ENABLED=true`; `hasGeminiConfigured()`/`isAiImportReady()`.

## 5. Import flow (giữ staging — KHÔNG auto-import)
Ảnh → `aiExtractRows` (require login, `checkAiImportFile`, chặn PDF/quá cỡ) → Gemini → insert
`import_batch_rows` (`reviewed=false`, `raw_data.source="GEMINI"` + confidence/needs_review/notes) →
**duyệt tay** ("Lưu & duyệt") → **Xác nhận** mới tạo `students` (RLS theo Khu phố). Audit `AI_IMPORT`
(chỉ số lượng, không PII).

## 6. UI/UX copy
- Form "AI đọc ảnh (Gemini)"; cảnh báo **"⚠️ AI có thể đọc sai. Vui lòng kiểm tra kỹ trước khi xác nhận."**
- Thiếu key/`AI_IMPORT_ENABLED=false` → nút AI **disabled** + thông báo; **nhập tay vẫn chạy**.
- Hiện **confidence %** + "nên kiểm tra kỹ" cho dòng `needs_review`; hiện `warnings` (ảnh mờ…).
- Không còn nhắc OCR.space.

## 7. Health/preflight
- `/api/health` phase `09b-gemini-ai-import` + `supabaseConfigured/databaseTypesReady/geminiConfigured/
  aiImportReady/docxExportReady/passwordChangeReady`. Không lộ key.
- Preflight: `OLD_PHASES` thêm `09a-…`; secret-scan bắt `GEMINI_API_KEY` (pattern `API_KEY`) — 0 rò rỉ.

## 8. Monitoring/log redaction
`src/lib/monitoring/server-log.ts`: structured JSON log ra console server + **redact** (khóa nhạy cảm
key/token/phone/name/base64 → "[đã ẩn]"; base64 dài cắt; dãy số ≥7 → "[số đã ẩn]"). AI import ghi
`ai_import_ok`/`ai_import_failed` chỉ với mime/size/rows — **không** ảnh/PII/key.

## 9. Tests / deploy / git
- `preflight` ✅ · `lint` ✅ · `typecheck` ✅ · `build` ✅.
- **Live smoke Gemini** (key local): ảnh danh sách 3 HS → HTTP 200, 3 dòng đúng (ngày `d/m/y→ISO`,
  SĐT giữ, dòng chỉ có năm → `birth_date=null` + note). Dọn sạch ảnh/script test (không commit).
- Deploy production + verify health/routes (mục K). Commit/push (mục M).

## 10. Env production cần cấu hình (thủ công — chưa tự thêm)
Trên Vercel (server-only, KHÔNG `NEXT_PUBLIC_`): `GEMINI_API_KEY` (bắt buộc để bật AI), tùy chọn
`GEMINI_MODEL`, `AI_IMPORT_MAX_FILE_MB`, `AI_IMPORT_ENABLED`. Thiếu key → AI tắt, nhập tay vẫn chạy.
Xem `gemini-ai-import.md`. **Lưu ý:** free tier có quota.

## 11. Chưa làm (đúng phạm vi)
PDF cho AI import (đang chặn); lưu ảnh gốc private + audit ảnh; monitoring tập trung/alert/uptime;
load test; UI polish lớn.

## 12. Gợi ý bước tiếp theo
1. **Cấu hình `GEMINI_API_KEY` trên Vercel** để bật AI import ở production (hiện chỉ nhập tay nếu chưa có).
2. **PDF cho AI import**: kiểm Gemini với `application/pdf` rồi mở whitelist nếu ổn.
3. **Monitoring nâng cao**: alert khi `/api/health` fail; gom log tập trung; uptime check.
4. **Lưu ảnh gốc AI import** vào bucket private + audit (khi cần đối chiếu).

## 13. Các điểm dự án cần tu sửa thêm
- Cân nhắc thêm giá trị enum `import_source = 'AI'` (migration **additive**) thay vì mượn `OCR`.
- Rate-limit/đếm số lần gọi Gemini theo người dùng để tránh lạm dụng quota.
- Dọn `DemoNotice` (chỉ export, không dùng); đồng bộ Postgres local major_version.

## 14. Những việc không nên làm ngay (tránh lan man)
- Không thêm SDK Gemini nặng khi `fetch` đã đủ.
- Không mở PDF/vòng lặp OCR phức tạp khi chưa kiểm chất lượng.
- Không tự thêm `GEMINI_API_KEY` vào Vercel khi user chưa cung cấp.
- Không auto-import (luôn giữ duyệt tay) — đây là bất biến an toàn của luồng import.
- Không giữ bất kỳ fallback OCR.space nào; fallback duy nhất là nhập tay.
