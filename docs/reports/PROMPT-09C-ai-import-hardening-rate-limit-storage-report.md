# Báo cáo PROMPT 09C — AI Import Hardening: enum AI + Rate-limit + Private Image Storage

- **Ngày:** 2026-07-08
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-09B-remove-ocrspace-gemini-ai-import-report.md`

## 1. Mục tiêu
Củng cố AI import: thêm enum `import_source='AI'`, rate-limit Gemini theo user/ngày, lưu ảnh gốc vào
Storage **private** để đối chiếu, monitoring/audit an toàn. Giữ staging (không auto-import), không quay
lại OCR.space, không phá Auth/RBAC/RLS/CRUD/Attendance/Leave/Notification/DOCX.

## 2. Hiện trạng trước
09B: Gemini AI import (server-only, Zod strict, `server-only` import theo Codex review). Lô AI mượn enum
`source='OCR'`. Chưa rate-limit, chưa lưu ảnh gốc. Health `09b-gemini-ai-import`.

## 3. Migration enum AI (additive)
- `20260708010000_add_ai_import_source.sql`: `alter type import_source add value if not exists 'AI'`
  (chỉ thêm — không dùng trong cùng migration → an toàn transaction; `OCR` giữ cho lịch sử).
- `20260708010100_ai_import_usage_and_doc_batch.sql`: `uploaded_documents.import_batch_id` (nullable FK);
  bảng `ai_import_usage`; RPC `consume_ai_import_quota`/`my_ai_import_usage_today`.
- `db push` OK (2 migration áp remote). `gen types` xác nhận `import_source = "OCR"|"MANUAL"|"AI"` + bảng
  usage + cột batch + RPC. **Không lỗi enum.**

## 4. Rate-limit
- Bảng `ai_import_usage(profile_id, used_on, count, unique(profile_id, used_on))`. RPC
  `consume_ai_import_quota(p_limit)` (SECURITY DEFINER) tăng **atomic** (`update … where count < p_limit
  returning`), trả `{allowed, used, limit_value}`. `AI_IMPORT_DAILY_LIMIT=50` (env).
- RLS: user đọc lượt **của mình**, Admin đọc tất cả; **không** policy ghi cho user (chỉ RPC ghi).
- Vượt hạn → **không** gọi Gemini, **không** upload; báo "Đã đạt giới hạn AI hôm nay… nhập tay hoặc thử
  lại ngày mai". Nhập tay vẫn chạy. UI hiện "lượt còn lại hôm nay" + disable nút khi hết.

## 5. Private image storage
- Bucket PRIVATE `ai-import-uploads` (ảnh jpg/png/webp, ≤ giới hạn MB). Path
  `<profileId>/<date>/<batchId>/<uuid>.<ext>` (không đoán được). **Không public URL.**
- Metadata `uploaded_documents` (bucket/path/mime/size/**sha256**/uploaded_by/**import_batch_id**) qua RLS
  (`doc_insert` cho secretary/admin). Storage binary bằng **service role** — chỉ **sau** khi xác thực
  user/role. UI liệt kê "Ảnh gốc đã lưu (riêng tư)" (size/ngày, không path/link).

## 6. Import flow update (`aiExtractRows`)
1. require login + **Server Action tự kiểm role SECRETARY/ADMIN và batch thuộc người gọi** + validate file
   (ảnh, ≤ MB, chặn PDF). Sai quyền/batch → dừng trước quota/upload/Gemini.
2. `isAiImportReady` (thiếu key/tắt → nhập tay).
3. **rate-limit** `consumeAiQuota` (vượt → dừng, báo, không Gemini/không upload).
4. **upload ảnh private** + ghi `uploaded_documents` (lỗi upload KHÔNG chặn — vẫn thử Gemini).
5. **Gemini** đọc (fail sau upload ⇒ ảnh vẫn còn để đối chiếu; user nhập tay).
6. insert dòng nháp `reviewed=false`, `raw_data.source="GEMINI"`; `import_batches.source='AI'`.
7. audit `AI_IMPORT` (mã lô + mã ảnh + số dòng, **không PII**) + `logEvent ai_import_ok`.
   **Không auto-import** — confirm mới tạo học sinh.

## 7. UI/copy
- "Lượt AI hôm nay: còn X/limit" (đỏ khi hết + hướng dẫn nhập tay). Cảnh báo "AI có thể đọc sai… Ảnh được
  lưu riêng tư để đối chiếu khi cần." Mục ảnh gốc riêng tư. Không nhắc OCR.

## 8. Monitoring/redaction
`server-log` events: `ai_import_rate_limited`, `ai_import_uploaded`, `ai_import_upload_failed`,
`ai_import_failed`, `ai_import_ok`. Chỉ log mã lô/tài liệu (uuid) + mime/size/rows. **Không** log path
(chứa profile id), ảnh, base64, họ tên, SĐT, key. Redact giữ nguyên (khóa nhạy cảm, base64 dài, số ≥7).

## 9. Health/preflight
- `/api/health` phase `09c-ai-import-hardening` + `supabaseConfigured/databaseTypesReady/geminiConfigured/
  aiImportReady/aiImportRateLimitReady/aiImportStorageReady/docxExportReady/passwordChangeReady`.
- Preflight: quét `GEMINI_API_KEY` (pattern `API_KEY`), `OLD_PHASES` thêm `09b`, không còn OCR.space active
  code, không in secret → PREFLIGHT OK.

## 10. Tests/deploy/git
- preflight/lint/typecheck/build xanh.
- **Smoke ký tên Admin thật** (publishable key, không service role cho RPC): `consume_ai_import_quota(2)`
  → allow(used1), allow(used2), **block**(used2); `my_ai_import_usage_today`=2; RLS đọc lượt của mình OK;
  bucket private upload/remove OK → **dọn sạch**.
- Deploy production + verify health/routes (mục L). Commit/push (mục N).

## 11. Chưa làm
Route tải/xem lại ảnh gốc trên UI + audit tải + retention xóa ảnh cũ; PDF cho AI import; monitoring tập
trung/alert/uptime; load test; UI polish lớn.

## 12. Gợi ý bước tiếp theo
1. **Cấu hình `AI_IMPORT_DAILY_LIMIT`** (nếu muốn khác 50) + xác nhận `GEMINI_API_KEY` trên Vercel.
2. **Route xem lại ảnh gốc** (Admin/Bí thư) qua stream server có xác thực + audit tải.
3. **Retention ảnh AI** (xóa sau N ngày) để tiết kiệm Storage + giảm rủi ro dữ liệu.
4. **Monitoring nâng cao**: alert khi `/api/health` fail; gom log tập trung; uptime check.

## 13. Các điểm dự án cần tu sửa thêm
- Cân nhắc rate-limit cả theo IP/khoảng thời gian (chống lạm dụng nhanh trong ngày).
- Chuẩn hóa `raw_data.source` dùng `AI` thay `GEMINI` cho nhất quán với enum (đồng bộ nhãn).
- Dọn `DemoNotice`; đồng bộ Postgres local major_version.

## 14. Những việc không nên làm ngay (tránh lan man)
- Không tự thêm key/limit vào Vercel khi user chưa yêu cầu.
- Không mở PDF/vòng lặp OCR phức tạp khi chưa kiểm chất lượng.
- Không bỏ bước duyệt tay / auto-import (bất biến an toàn).
- Không public bucket ảnh; không trả path/URL ảnh ra client.
- Không dùng service role cho usage counter khi RPC/RLS đã đủ.
