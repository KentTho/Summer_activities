# Project Repair Backlog

> Tạo ở **Prompt 09A**. Theo dõi việc cần sửa/nâng cấp, tách rõ: đã xử lý · còn lại · không làm ngay.

## Đã xử lý ở 09F
- [x] **Chẩn đoán Admin login**: script `recover-admin-account.mjs` (chế độ chẩn đoán) — Admin gốc **khỏe mạnh**
      (auth có, role ADMIN, active, `must_change_password=false`); nguyên nhân không vào được = **sai mật khẩu**.
- [x] **Admin recovery (break-glass)**: `npm run recover:admin` đặt lại mật khẩu (env `ADMIN_RECOVERY_*`,
      không hardcode/không in), đảm bảo role ADMIN/active; `docs/admin-access-recovery.md`.
- [x] **Admin login UX**: bỏ link "Quên mật khẩu?" công khai ở `/admin/login`, thay bằng chỉ dẫn khôi phục
      trên máy chủ; giữ `/forgot-password` cho Bí thư/Phụ huynh.
- [x] **Smoke session thật**: đăng nhập Admin + ép đổi mật khẩu (6 pass, tài khoản disposable, cleanup);
      **phân quyền route ảnh 4 vai trò** (8 pass, fixtures `SMOKE_09F_`, cleanup) — `smoke-ai-image-route.mjs`.
- [x] Health phase `09f-…` + cờ `adminRecoveryReady/adminLoginSmokeReady/aiImageRoleSmokeReady`.
- [ ] **Gán Khu phố cho 2 Bí thư** `0944577905`/`0368103532` — **cần Admin** làm qua `/admin/secretaries`
      (không tự gán bừa).

## Đã xử lý ở 09E
- [x] **Quên mật khẩu**: bảng `password_reset_requests` (RLS chỉ Admin) + RPC `request_password_reset`
      (SECURITY DEFINER, trung lập, chống spam 24h, khớp hồ sơ). Trang công khai `/forgot-password` + link 2 cổng.
- [x] **Admin xử lý**: `/admin/password-requests` cấp mật khẩu tạm (reuse reset, must_change_password) / từ chối;
      audit `RESOLVE/REJECT_PASSWORD_RESET_REQUEST`; alert PENDING ở dashboard + nav.
- [x] **UUID validate sớm** cho route ảnh (`batchId`/`documentId`) → 404 nhanh, không lộ path.
- [x] **2 tài khoản Bí thư mới** (script `provision-secretaries.mjs`, env-driven, số tài khoản không ghi vào report/source,
      must_change_password, chưa phân công) + highlight "chưa phân công" ở `/admin/secretaries`.
- [x] **Gemini dry-run 3 ảnh** `src/images` (`test:ai-local-images`) — report **gitignored** (PII).
- [x] Health phase `09e-…` + cờ `passwordResetRequestReady/secretaryProvisioningReady/realSessionImageSmokeReady`.

## Đã xử lý ở 09D
- [x] **Route xem/tải ảnh gốc** `GET /user/secretary/import/[batchId]/documents/[documentId]` (+`?download=1`):
      xác thực trong handler, ADMIN tất cả / SECRETARY theo scope lô / PARENT chặn; ràng buộc `import_batch_id`+bucket.
- [x] **Audit** `VIEW_AI_IMPORT_IMAGE`/`DOWNLOAD_AI_IMPORT_IMAGE` (không PII/path). UI nút "Xem ảnh gốc" (không lộ path).
- [x] **Retention** `scripts/cleanup-ai-import-images.mjs` (dry-run mặc định, cần `--apply`; chỉ bucket ai-import-uploads).
- [x] **Monitoring nhẹ** `scripts/check-production-health.mjs` + `docs/monitoring-uptime.md` + workflow `healthcheck.yml`.
- [x] **raw_data.source** dòng AI = `"AI"` (đồng bộ `import_batches.source`); `GEMINI`=provider, `AI`=nghiệp vụ.
- [x] Health phase `09d-ai-import-evidence-monitoring` + cờ `aiImportImageViewerReady/aiImportRetentionReady/monitoringReady`.
- [x] Docs tiêu chí prompt AI `docs/ai-agent-prompt-criteria.md` (rút gọn cho dự án).

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
1. **Monitoring nâng cao**: (09B/09C logger redact PII; **09D** có uptime check `healthcheck.yml` +
   `check-production-health.mjs`) — còn lại: alert Slack/Telegram khi fail liên tiếp; gom log tập trung.
2. **Load test sau MVP**: mô phỏng ghi điểm danh dồn cuối buổi; xem index/độ trễ.
3. **Xem lại ảnh gốc AI trên UI**: ✅ **XONG ở 09D** (route xác thực + audit + nút xem + retention dry-run).
   Còn lại (không gấp): tự động chạy retention `--apply` định kỳ (cron/GitHub Actions) sau khi xác nhận an toàn.
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
