# Project Repair Backlog

> Tạo ở **Prompt 09A**. Theo dõi việc cần sửa/nâng cấp, tách rõ: đã xử lý · còn lại · không làm ngay.

## Đã xử lý ở 09C
- [x] Enum `import_source='AI'` (additive) — lô AI đánh `source='AI'`; `OCR` giữ cho lịch sử.
- [x] **Rate-limit** AI theo user/ngày (`ai_import_usage` + RPC atomic `consume_ai_import_quota`), env `AI_IMPORT_DAILY_LIMIT`.
- [x] **Lưu ảnh gốc private** (`ai-import-uploads`) + `uploaded_documents.import_batch_id`; đối chiếu khi AI đọc sai.
- [x] Monitoring: `ai_import_rate_limited/uploaded/failed/upload_failed/ok` (redact PII/path/key).
- [x] Health phase `09c-ai-import-hardening` + cờ `aiImportRateLimitReady/aiImportStorageReady`.
- [x] Docs `storage-policy.md`; cập nhật gemini-ai-import/test-plan.

## Đã xử lý ở 09B
- [x] **Bỏ OCR.space hoàn toàn** (code/env/UI copy/docs); fallback duy nhất là nhập tay.
- [x] **Gemini Vision AI import**: ảnh → JSON schema chặt (Zod) → dòng nháp `needs_review` → duyệt tay → confirm.
- [x] Monitoring nhẹ `lib/monitoring/server-log.ts` (redact PII/key/base64) + log lỗi/OK AI import.
- [x] Health phase `09b-gemini-ai-import` + cờ `geminiConfigured/aiImportReady`.

## Đã xử lý ở 09A
- [x] Ép đổi mật khẩu lần đầu (`must_change_password` → `/change-password`, xóa cờ sau khi đổi).
- [x] DOCX placeholder-merge tối giản từ mẫu upload (`{{...}}`) + fallback DOCX tự sinh.
- [x] Dọn dead code `src/lib/mock/*` (không còn import).
- [x] Phân trang `/admin/students` (page/pageSize whitelist, giữ search/filter).
- [x] `/api/health` phase `09a-production-hardening` + cờ tính năng.
- [x] Preflight script (`npm run preflight`) + playbook vận hành (5 docs).
- [x] Docs OCR production (`ocr-production-setup.md`).

## Còn lại trước khi "UI polish"
1. **Monitoring nâng cao**: (09B/09C có logger nhẹ redact PII) — còn lại: alert khi `/api/health` fail;
   gom log tập trung; uptime check.
2. **Load test sau MVP**: mô phỏng ghi điểm danh dồn cuối buổi; xem index/độ trễ.
3. **Xem lại ảnh gốc AI trên UI**: (09C đã lưu private + liệt kê metadata) — còn lại: route xác thực để
   tải/xem ảnh + audit tải; retention xóa ảnh cũ.
4. **PDF cho AI import**: hiện chặn PDF; thêm khi xác nhận Gemini path ổn với PDF.
5. **Advanced DOCX template engine**: vòng lặp/điều kiện/bảng động, placeholder bị tách run.
6. **Dọn `DemoNotice` component** nếu vẫn không dùng (hiện chỉ export, không render ở app).
7. **Đồng bộ Postgres local `major_version`** (15 local vs 17 remote) — chỉ ảnh hưởng dev.

## Không nên làm ngay (tránh lan man)
- Logout-all / token-version thật (chỉ backlog trong `auth-session-hardening.md` — chưa cần).
- MFA/OTP điện thoại thật, rate-limit đăng nhập nâng cao.
- UI polish toàn hệ thống (màu/nhịp/skeleton…) — làm sau khi nghiệp vụ/vận hành ổn.
- Viết engine DOCX đầy đủ khi placeholder-merge tối giản đã đủ cho biểu mẫu hiện tại.
- Thêm thư viện nặng cho ZIP/DOCX khi bản zero-dependency đang chạy tốt.

## Ưu tiên đề xuất
1. Monitoring nâng cao (alert/uptime) → 2. Load test sau MVP → 3. AI import image private storage →
4. PDF cho AI import → 5. Advanced DOCX template → 6. UI polish toàn hệ thống.
