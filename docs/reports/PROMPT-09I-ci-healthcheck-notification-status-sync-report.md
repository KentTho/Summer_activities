# PROMPT 09I — CI Healthcheck Hotfix + Notification Status Sync + Workflow Verification

**Trạng thái tổng:** ✅ Hotfix xong. Nguyên nhân GitHub fail = **file đúng nằm ở working tree chưa commit**.
Đã commit bản đúng + thêm `EXPECT_PHASE` override chống tái diễn; sync PROJECT_PROGRESS; thêm unread badge
3 cổng. Local: `healthcheck` PASS (prod phase 09h), lint/typecheck/build ✅.

---

## 1. Mục tiêu
Sửa GitHub healthcheck fail (expect 09f vs prod 09h), đồng bộ phase ở scripts/workflows/docs, sync trạng thái
Phase 11/12, thêm unread badge nếu an toàn. **Không** đổi RLS/schema.

## 2. Nguyên nhân GitHub job fail
- `.github/workflows/healthcheck.yml` chạy `node scripts/check-production-health.mjs` trên **bản đã commit**.
- Bản committed (HEAD `7a1f7fd`) có `EXPECT_PHASE = "09f-admin-recovery-image-smoke"`.
- Thay đổi sang `09h-…` **chỉ nằm ở working tree, CHƯA commit** (bị để ngoài scope stage ở 09G/09H).
- Production `/api/health.phase = 09h-…` → script (bản cũ) mong đợi 09f → **mismatch → exit 1 → job fail**.
- Source app luôn đúng (health route = 09h); lỗi thuần do **file kiểm tra chưa được commit**.

## 3. Files có phase cũ tìm thấy
| File | Giá trị (committed) | Loại | Cần sửa? |
|---|---|---|---|
| `src/app/api/health/route.ts` | `09h-…` | active (đúng) | Không |
| `scripts/check-production-health.mjs` | **`09f-…` (committed)** vs `09h` (working tree) | active | **Có — commit + override** |
| `scripts/preflight-check.mjs` OLD_PHASES | thêm 09f/09g (working tree, chưa commit) | active | **Có — commit** |
| `.github/workflows/healthcheck.yml` | gọi script, không hardcode phase | active | Thêm comment override |
| `docs/reports/PROMPT-09F/09G/09H*` | phase trong report lịch sử | history | **Không sửa** |

## 4. Healthcheck script fix
`scripts/check-production-health.mjs`:
- `DEFAULT_EXPECT_PHASE = "09h-prod-hardening-ci-notifications"` + override `EXPECT_PHASE` env.
- Output: URL + `phase` thực tế + phase mong đợi + timestamp. Exit 1 khi unreachable / JSON lỗi / mismatch.
- **Không** hardcode 09F ở bất kỳ nhánh nào. Comment nhắc đồng bộ với health route khi lên phase.

## 5. Workflow fix
- `healthcheck.yml`: giữ gọi script (default = phase hiện tại) + comment hướng dẫn override `EXPECT_PHASE`
  (không hardcode giá trị trong workflow → 1 nguồn = script). Không dùng secret.
- `e2e-smoke.yml` / `ai-import-retention.yml` / `ci.yml`: **không đổi** (đang ổn; smoke chạy có điều kiện +
  fail-fast; PR từ fork không bị buộc chạy smoke).

## 6. Preflight fix
`scripts/preflight-check.mjs` OLD_PHASES gồm `…09e, 09f, 09g` (stale), **không** gồm 09h → commit bản đúng.
Preflight PASS với phase hiện tại 09h.

## 7. PROJECT_PROGRESS sync
- Bảng tổng quan: **Phase 11 — Notification → ✅ Done (MVP/core)** (hủy/dời tự gửi, Admin gửi hệ thống/Khu phố,
  unread + mark-read, smoke 8/8; realtime + badge nâng cao ghi backlog).
  **Phase 12 — Deploy + hardening → ✅ Done (MVP/core)** (service role prod set + prod smoke 25/25, defensive
  503, CI smoke + retention, health phase sync; alert nâng cao backlog).
- Checklist: notification smoke **8/8**, local ai-image-http **25/25**, prod **25/25**.
- Rủi ro “PRODUCTION thiếu service role” → **đã gỡ** (giữ cảnh báo rotate key nếu từng lộ).
  “2 Bí thư chưa phân công” vẫn còn (chờ Admin).

## 8. Notification badge
- `DashboardShell` (server, async) gọi `countMyUnreadNotifications()` → truyền `unreadCount` cho `SidebarNav`.
- `SidebarNav` hiện badge trên mục có href kết thúc `/notifications` (Phụ huynh/Bí thư/Admin) khi > 0
  (99+ khi lớn). Near-real-time (render mỗi trang). Parent unread/mark-read cũ **không đổi**.
- **Không** realtime subscription (backlog). Không UI polish lớn.

## 9. Validation
- `node --check` health + preflight script ✅.
- `npm run healthcheck` → **PASS** (`phase=09h-…` khớp prod).
- `npm run preflight` ✅ · `lint` ✅ · `typecheck` ✅ · `build` ✅.

## 10. Deploy
- 09I có sửa **runtime app** (nav badge trong DashboardShell) → **redeploy production**.
- Post-deploy verify: `/api/health` phase 09h; endpoints `/admin/login`·`/user/login` = 200. (Xem §11 git.)

## 11. Git
- Stage file cụ thể (không `git add .`): scripts (2), workflow (1), src (3: DashboardShell/SidebarNav +
  không đổi khác), docs (progress/backlog/monitoring/notification), report 09I.
- **Không stage**: `.env.example`, reports 06A/06B, **xóa PROMPT-10A** (deletion có sẵn ngoài scope — cần
  bạn xử lý riêng), các file pre-existing khác không thuộc 09I.

## 12. Chưa làm
- Realtime subscription notification (đang near-real-time).
- Gán Khu phố cho 2 Bí thư (chờ Admin).
- Alert monitoring nâng cao (Slack/Telegram).

## 13. Gợi ý bước tiếp theo
1. Sau khi push: **rerun** GitHub `healthcheck.yml` (workflow_dispatch) trên commit mới → xanh.
2. Bật CI smoke: thêm Repository Secrets + `vars.RUN_E2E_SMOKE='true'` (nếu muốn lịch chạy).
3. Cân nhắc realtime notification + alert monitoring.
4. Admin gán Khu phố cho 2 Bí thư.

## 14. Các điểm dự án cần tu sửa thêm
- **Đồng bộ phase 1 nguồn**: hiện phải cập nhật `health route` + `DEFAULT_EXPECT_PHASE`. Cân nhắc export phase
  từ 1 module dùng chung để healthcheck/preflight đọc (tránh lệch).
- **Deletion PROMPT-10A** trong working tree chưa xử lý — xác nhận giữ/khôi phục.
- Chốt kiến trúc `src/modules/*` (có test) — vẫn lệch `architecture.md`.

## 15. Những việc không nên làm ngay
- Realtime subscription phức tạp khi near-real-time đã đủ MVP.
- Refactor lớn / UI polish toàn hệ thống.
- Hardcode phase vào nhiều workflow (giữ 1 nguồn ở script).
- Đổi RLS/schema/migration cho việc hotfix CI.

## 16. Codex review prompt
> Review PR 09I (hotfix CI + badge, KHÔNG đổi RLS/schema). Kiểm:
> 1. `check-production-health.mjs`: còn nhánh nào hardcode 09F/09G không? `EXPECT_PHASE` override đúng chưa?
>    exit code đúng cho unreachable/JSON lỗi/mismatch?
> 2. `preflight-check.mjs` OLD_PHASES có vô tình chặn phase hiện tại (09h) không?
> 3. `DashboardShell` async + `countMyUnreadNotifications` mỗi render: có rủi ro query nặng/N+1 hay lỗi khi
>    chưa đăng nhập không? Badge chỉ hiện đúng mục `/notifications`?
> 4. Có in secret/phase-token nào trong workflow/log không?
> 5. Có stage nhầm deletion PROMPT-10A hay file ngoài scope không?
