# PROMPT 09H — Production Service Role Closure + Defensive Hardening + CI Smoke + Retention + Notifications

**Trạng thái tổng:** ✅ Hardening + CI/retention workflows + Notification core + docs sync hoàn tất.
✅ **Blocker production ĐÃ GỠ + VERIFY**: `SUPABASE_SERVICE_ROLE_KEY` đã có trên Vercel Production (xác nhận
`vercel env ls`, Encrypted — không lộ); đã **redeploy** (health prod = `09h-…`, `serviceRoleConfigured:true`).
Runtime: local HTTP **25/25**, **production HTTP 25/25** (ADMIN/SECRETARY nay **200**), notification **6/6**.

---

## 1. Mục tiêu
1. Đóng blocker `SUPABASE_SERVICE_ROLE_KEY` trên Vercel Production + redeploy + verify.
2. Hardening route ảnh AI: thiếu service role → **503 thân thiện** (không 500 trần).
3. Rerun smoke ai-image-http local/production.
4. CI smoke workflow (Repository Secrets, fail-fast, không lộ secret).
5. Retention workflow tự động (dry-run mặc định; apply chỉ khi bật cờ repo).
6. Notification Phase 11 core: tự gửi khi hủy/dời buổi; Admin gửi hệ thống/Khu phố; unread + mark-read.
7. README/architecture docs sync theo 10A.

## 2. Hiện trạng trước
| Hạng mục | Trước 09H |
|---|---|
| Service role prod | 09G phát hiện thiếu → route 500 cho ADMIN/SEC-in |
| Route ảnh AI | 500 trần khi thiếu service role |
| CI | chỉ lint/typecheck/build; chưa có smoke E2E |
| Retention | script dry-run/apply có sẵn, **chưa** có workflow |
| Notification | gửi theo buổi thủ công; **chưa** tự gửi khi hủy/dời; chưa Admin-system; chưa unread/mark-read |
| README | stale ("Phase 1 — Scaffold") |

## 3. Production service role env
- `vercel env ls production` (không in giá trị): `SUPABASE_SERVICE_ROLE_KEY` **có** cho Production + Preview
  (thêm ~23 phút trước lần chạy 09H). Blocker 09G **đã được gỡ**.
- Vì deployment đang chạy có **trước** khi thêm env → cần **redeploy** để runtime nhận key.
- Sau redeploy verify `/api/health.serviceRoleConfigured === true` + smoke prod (xem §5).
- Checklist an toàn: `docs/production-env-checklist.md` (không in secret; hướng dẫn xoay khóa nếu lộ).

## 4. Defensive 503 route ảnh AI
`src/app/user/secretary/import/[batchId]/documents/[documentId]/route.ts`:
- Sau khi xác thực role + chứng minh quyền lô qua RLS, **trước** khi đọc nhị phân service role:
  - `!hasServiceRoleKey()` ⇒ `logEvent("ai_image_storage_not_configured", { role })` + **503**
    “Dịch vụ lưu trữ chưa được cấu hình, vui lòng liên hệ Admin hệ thống.”
  - `getAiImportDocForBatch`/`downloadAiImportImage` bọc try/catch ⇒ lỗi bất ngờ → `logError` + **503**.
- Header thành công giữ nguyên: `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`,
  `Content-Disposition` inline/attachment. Gating giữ nguyên (ADMIN all, SECRETARY scope, PARENT chặn, UUID→404).
- Log **không** key/path/PII.

## 5. Local/Production AI image HTTP smoke
- Script `e2e-ai-image-route-http-smoke.mjs` thêm nhánh **503 = BLOCKED BY ENV** (không coi 500 là pass;
  không báo production pass giả). Fail-fast khi thiếu `E2E_BASE_URL`.
- **LOCAL (`http://localhost:3000`, có service role):** ✅ **25/25 pass** — unauth 307; ADMIN inline/download
  200 + đủ header; SECRETARY đúng scope 200; sai scope 404; PARENT 403; audit VIEW/DOWNLOAD đúng actor;
  không rò bucket/path.
- **PRODUCTION (`summer-activities-theta.vercel.app`) sau redeploy:** ✅ **25/25 pass** — ADMIN inline/download
  **200** + đủ header; SECRETARY đúng scope **200**; sai scope 404; PARENT 403; unauth 307; audit đúng.
  Blocker 09G đóng hoàn toàn (health prod `serviceRoleConfigured:true`).

## 6. CI smoke automation
`.github/workflows/e2e-smoke.yml`:
- Trigger: `workflow_dispatch` (tay) + `schedule` (chạy khi `vars.RUN_E2E_SMOKE=='true'`).
- Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `E2E_BASE_URL`. **Fail-fast** nếu thiếu (không in giá trị).
- Chạy: `npm ci` → preflight → `node scripts/e2e-admin-login-smoke.mjs` → password-request → ai-image-http
  (gọi node trực tiếp với env từ secrets, KHÔNG cần `.env.local`, KHÔNG in secret/cookie).
- Không destructive (không retention apply ở đây). CI hiện có (`ci.yml`) giữ nguyên.

## 7. Retention workflow
`.github/workflows/ai-import-retention.yml`:
- Schedule hằng tuần + dispatch (chọn `days`). **DRY-RUN mặc định.**
- `--apply` CHỈ khi `vars.AI_IMPORT_RETENTION_APPLY=='true'` (in cảnh báo khi apply).
- Chỉ bucket `ai-import-uploads`; không đụng batch/rows/students. Không in path/secret.
- Script `cleanup-ai-import-images.mjs` giữ nguyên (đã an toàn: dry-run mặc định, `--days=90`, redact path).

## 8. Notification Phase 11
- **Data helpers** `src/lib/data/notifications.ts`: `getSessionRecipientProfileIds`,
  `getNeighborhoodParentProfileIds`, `sendNotificationToProfiles`, `countMyUnreadNotifications`,
  `markNotificationRead`, `markAllNotificationsRead`; `listMyNotifications` thêm `readAt`/`unread`.
- **Tự gửi khi hủy buổi** (`cancelSession`): thêm field `reason` tùy chọn; gửi phụ huynh “Hủy buổi: …”
  + lý do + ngày. Chỉ gửi khi vừa chuyển sang hủy. Best-effort (không chặn nghiệp vụ).
- **Tự gửi khi dời buổi** (`rescheduleSession`): lấy ngày/giờ cũ trước update; gửi “Đổi lịch: … từ cũ→mới”.
- **Admin gửi hệ thống/Khu phố** `/admin/notifications` (page + form + action): SYSTEM (mọi hồ sơ active trừ
  người gửi) hoặc NEIGHBORHOOD (phụ huynh của Khu phố). Audit `SEND_SYSTEM_NOTIFICATION`. Nav Admin thêm link.
- **Unread + mark-read** (Phụ huynh): số chưa đọc + “Đánh dấu đã đọc (tất cả)”, dòng chưa đọc tô nổi.
- **RLS**: dùng helper SECURITY DEFINER sẵn có (không đệ quy 42P17); `nr_update` chỉ cho người nhận sửa
  `read_at` của mình. **Không** migration (cột `read_at` đã có). Audit không PII.
- **Near-real-time**: đếm/đánh dấu server-side + `revalidatePath` (chưa realtime subscription — backlog).
- **Notification smoke** `e2e-notification-smoke.mjs` (`npm run smoke:notification`): ✅ **6/6 pass** —
  secretary insert notification+recipient; parent thấy + chưa đọc=1; parent khác KHÔNG thấy (RLS);
  mark-read → chưa đọc=0. Fixtures `SMOKE_09H_`, cleanup sạch.

## 9. README/architecture sync
- `README.md` viết lại đúng trạng thái 09H + bảng env production (nhấn `SUPABASE_SERVICE_ROLE_KEY` server-only)
  + scripts + CI/automation + cấu trúc thực tế (`src/lib/data/*`).
- `docs/folder-architecture-standard.md` thêm ghi chú 09H: logic/data-access ở `src/lib/*`; `src/modules/*`
  skeleton — **không** refactor lớn; quy tắc feature mới.
- Mới: `docs/notification-system.md`, `docs/production-env-checklist.md`.
- `docs/project-repair-backlog.md`: mục “Đã xử lý ở 09H” + OPERATION REQUIRED (service role prod).

## 10. Health/preflight
- `/api/health.phase` = `09h-prod-hardening-ci-notifications`.
- Cờ mới: `serviceRoleConfigured` (= `hasServiceRoleKey()`), `notificationCoreReady`,
  `retentionWorkflowReady`, `ciSmokeReady` (giữ cờ cũ). **Không** expose secret.
- `npm run preflight`: ✅ OK.

## 11. Runtime smoke
- Local: `smoke:ai-image-http` **25/25**, `smoke:notification` **6/6** (target Supabase thật, cleanup sạch).
- `smoke:admin-login` / `smoke:password-request`: giữ pass từ 09G (logic không đổi).
- Production `smoke:ai-image-http` sau redeploy: ✅ **25/25** (ADMIN/SECRETARY 200). Endpoints
  `/admin/login`·`/user/login`·`/forgot-password` = 200.

## 12. Tests/deploy/git
- `node --check` 6 script ✅ · preflight ✅ · lint ✅ · typecheck ✅ · build ✅ (routes `/admin/notifications`,
  `/user/parent/notifications` build OK).
- Deploy: `npx vercel deploy --prod` (đã auth project). Post-deploy verify: §3/§5/§10.
- Commit: stage file cụ thể (không `git add .`); không secret/`.env`/`.next`/ảnh PII.
- **Ngoài scope, KHÔNG stage:** `.env.example`, reports 06A/06B/09F/09G (linter), **xóa PROMPT-10A**
  (deletion có sẵn từ session trước — cần bạn xem lại), các script/src pre-existing không thuộc 09H.

## 13. Chưa làm
- Realtime subscription cho notification (đang near-real-time).
- Nav badge unread cho Secretary/Admin (mới làm count ở trang Phụ huynh + data helper sẵn sàng).
- Refactor `src/modules/*` (cố ý hoãn — cần test bao phủ).
- Gán Khu phố thật cho 2 Bí thư (chờ Admin chỉ định).

## 14. Gợi ý bước tiếp theo
1. Bật CI smoke: thêm Repository Secrets + (tùy chọn) `vars.RUN_E2E_SMOKE='true'`; chạy `workflow_dispatch` 1 lần.
2. Sau vài tuần dữ liệu ảnh AI: kiểm dry-run retention rồi cân nhắc `vars.AI_IMPORT_RETENTION_APPLY='true'`.
3. Thêm nav badge unread (dùng `countMyUnreadNotifications`) cho 3 cổng + cân nhắc realtime.
4. Gán Khu phố cho 2 Bí thư (`npm run assign:secretaries`).

## 15. Các điểm dự án cần tu sửa thêm
- **Rotate service role key** nếu từng bị lộ ngoài kênh tin cậy (xem `production-env-checklist.md`).
- Nav badge + realtime notification; gom test E2E vào CI bắt buộc trên PR (khi có môi trường test riêng).
- Chốt kiến trúc `src/modules/*` (có test) — vẫn lệch `architecture.md`.
- Alert monitoring (Slack/Telegram) khi healthcheck fail liên tiếp.

## 16. Những việc không nên làm ngay
- Bật retention `--apply` tự động khi chưa kiểm dry-run + backup.
- Refactor lớn `src/modules/*` hay UI polish toàn hệ thống trong lúc đang mở nhiều luồng.
- Public bucket ảnh/template để “test dễ”; đổi DOCX engine; mở PDF AI import.
- Hardcode secret vào CI/script để chạy nhanh.

## 17. Codex review prompt
> Review PR 09H (hardening + workflows + notifications, KHÔNG đổi RLS/schema). Kiểm:
> 1. Route ảnh AI: nhánh 503 có che hết trường hợp thiếu/không tạo được admin client không? Có rò
>    path/stack/PII trong body/log 503 không? Header thành công còn đủ no-store/nosniff/disposition?
> 2. `notifications.ts`: `sendNotificationToProfiles` có nguy cơ tạo notification “mồ côi” (không recipient)
>    khi list rỗng không? `countMyUnread`/`markRead` có đi đúng RLS `nr_update` (chỉ của mình) không?
> 3. `cancelSession`/`rescheduleSession`: auto-notify best-effort có thể chặn nghiệp vụ nếu lỗi không?
>    Có gửi trùng/nhầm người nhận ngoài Khu phố buổi không?
> 4. Admin `sendSystemNotification`: SYSTEM gửi mọi profile active — có rủi ro volume/nội dung nhạy cảm không?
>    NEIGHBORHOOD có lọc đúng phụ huynh Khu phố không?
> 5. Workflows: fail-fast secrets đúng chưa? Có in secret/cookie ở đâu không? Retention apply có thực sự
>    chỉ chạy khi `vars.AI_IMPORT_RETENTION_APPLY=='true'` không?
> 6. Có chỗ nào 500 trần còn sót cho path service role không?
