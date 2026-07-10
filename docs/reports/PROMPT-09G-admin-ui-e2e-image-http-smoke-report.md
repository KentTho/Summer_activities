# PROMPT 09G — Admin UI E2E + Secretary Assignment + HTTP Cookie Image Smoke

**Trạng thái tổng:** ✅ Tooling + docs hoàn tất · ✅ **RUNTIME smoke ĐÃ CHẠY THẬT** (có `.env.local`):
admin-login **4/4**, password-request **8/8**, ai-image-http **local 19/19**. ⚠️ **PHÁT HIỆN PRODUCTION:**
route ảnh AI **500** cho ADMIN/SECRETARY hợp lệ vì **Vercel production thiếu `SUPABASE_SERVICE_ROLE_KEY`**
(auth/role/RLS gating vẫn đúng: 307/403/404). Cần set env này trên Vercel → route trả 200 như local.

> 🔴 **HÀNH ĐỘNG VẬN HÀNH (ưu tiên cao):** thêm `SUPABASE_SERVICE_ROLE_KEY` vào Environment Variables của
> Vercel (Production) rồi redeploy. Trước khi set, route xem/tải ảnh gốc AI **hỏng trên production** (500).

---

## 1. Mục tiêu
1. Xác minh Admin đăng nhập bằng session/JWT thật sau recovery (E2E).
2. Gán Khu phố cho 2 Bí thư mới **an toàn** (ưu tiên chỉ định rõ; nếu chưa có → dry-run + hướng dẫn).
3. Smoke quên mật khẩu end-to-end (tạo → Admin thấy PENDING → resolve → audit không PII).
4. Smoke route ảnh AI qua **HTTP + cookie thật** cho từng vai trò (status/header/audit).
5. Cleanup fixtures; cập nhật health phase `09g-e2e-image-admin-assignment`; docs/report.

## 2. Hiện trạng trước (Phase 2 — map)
| Hạng mục | Hiện trạng trước 09G | Rủi ro | Hành động 09G |
|---|---|---|---|
| Admin recovery/login | 09F: Admin gốc khỏe, có `recover:admin`; smoke login bằng session thật (6/6) | Chưa E2E disposable-admin riêng biệt | Thêm `e2e-admin-login-smoke.mjs` |
| 2 Bí thư mới | role SECRETARY/active, **0 phân công** | Tự gán bừa | `assign-secretaries-neighborhoods.mjs` dry-run + APPLY có chỉ định |
| Forgot-password | 09E: bảng + RPC + Admin resolve; smoke session thật **chưa chạy** | Chưa verify audit no-PII end-to-end | `e2e-password-request-smoke.mjs` |
| Route ảnh AI | 09D route + 09F gate RLS (8/8) | **Chưa gọi HTTP/cookie thật** (medium Codex) | `e2e-ai-image-route-http-smoke.mjs` |
| Audit view/download | route ghi `VIEW/DOWNLOAD_AI_IMPORT_IMAGE` | Chưa assert actor/no-leak qua HTTP | assert trong script HTTP |
| Script smoke | 09F `smoke-ai-image-route.mjs` (RLS gate) | Chỉ RLS, không HTTP | bổ sung 3 script E2E + 1 công cụ gán |

## 3. Admin login E2E
- Script `scripts/e2e-admin-login-smoke.mjs` (`npm run smoke:admin-login`).
- Tài khoản **disposable** `SMOKE_09G_adminlogin` (service role chỉ seed/cleanup — **không đụng Admin gốc**).
- Kiểm: (1) sai mật khẩu → `signInWithPassword` lỗi, không session; (2) đúng → session + `access_token`;
  (3) JWT hợp lệ → `getUser` trả đúng user; (4) hồ sơ `role=ADMIN`/`active=true`.
- Tùy chọn `E2E_BASE_URL`: `GET /admin/login = 200`; `GET /admin` không cookie → redirect `login`.
- **Không** in mật khẩu/JWT/cookie. Cleanup xóa profile + auth user.
- **Runtime:** ✅ **ĐÃ CHẠY — 4/4 pass** (`Target: ymtogeacpnlmthjlryrd.supabase.co`). HTTP guard bỏ qua
  (không set `E2E_BASE_URL` cho script này); phần Auth/JWT/hồ sơ verify đầy đủ.

## 4. Secretary assignment status/action
- Script `scripts/assign-secretaries-neighborhoods.mjs` (`npm run assign:secretaries`).
- **MẶC ĐỊNH DRY-RUN**: liệt kê Bí thư (role SECRETARY) + trạng thái phân công; Bí thư 0 Khu phố →
  in **"CHƯA PHÂN CÔNG"** + hướng dẫn Admin gán ở `/admin/secretaries`. **Không thay đổi dữ liệu.**
- **APPLY** (chỉ khi có chỉ định rõ): `ASSIGN_SECRETARIES_JSON='[{"identifier":"...","neighborhood_code":"KP01","assignment_role":"COORDINATING"}]'`
  + `ASSIGN_SECRETARIES_APPLY=true` → gán đúng chỉ định, giữ ràng buộc 1 Phụ trách chính/Khu phố,
  ghi audit `ASSIGN_NEIGHBORHOOD` (actor = Admin active). Redact identifier (3 số cuối).
- **Quyết định 09G:** **KHÔNG tự gán** 2 Bí thư mới vì **chưa có chỉ định Khu phố** từ nghiệp vụ →
  giữ "Chưa phân công" (đúng yêu cầu an toàn); Admin gán qua UI hoặc APPLY khi có chỉ định.

## 5. Forgot-password E2E
- Script `scripts/e2e-password-request-smoke.mjs` (`npm run smoke:password-request`).
- Flow đúng như app: anon gọi RPC `request_password_reset` (trung lập) → anon **KHÔNG** đọc bảng (RLS)
  → Admin (session thật) thấy **PENDING** + `matched_profile_id` khớp → resolve (reset mật khẩu tạm +
  `must_change_password=true` + status **RESOLVED** + audit) → đăng nhập bằng mật khẩu tạm **OK** →
  audit `RESOLVE_PASSWORD_RESET_REQUEST` tồn tại + **không chứa SĐT/email/mật khẩu**.
- Fixtures `SMOKE_09G_` (PARENT phone giả `099…` + Admin disposable). Cleanup: xóa request + account;
  **audit append-only giữ lại** (ghi rõ trong log).
- **Runtime:** ✅ **ĐÃ CHẠY — 8/8 pass** (anon trung lập, RLS chặn anon, PENDING+match, RESOLVED, login
  mật khẩu tạm OK, audit không PII).

## 6. HTTP cookie image route smoke
- Script `scripts/e2e-ai-image-route-http-smoke.mjs` (`npm run smoke:ai-image-http`, cần `E2E_BASE_URL`).
- **Cookie dựng khớp `@supabase/ssr` v0.12** (đã đối chiếu `node_modules`):
  `sb-<ref>-auth-token` (ref = `hostname.split('.')[0]`), value = `base64-` + base64url(JSON session),
  chunk `.0/.1` khi encode > **3180** (đúng `createChunks`); vừa 1 chunk → giữ tên gốc.
- Seed `SMOKE_09G_`: 2 Khu phố, Admin, Secretary đúng scope, Secretary sai scope, Parent, 1 lô AI,
  1 `uploaded_documents`, 1 ảnh 1×1 PNG (không PII) trong bucket **private** `ai-import-uploads`.
- Gọi route thật `/user/secretary/import/{batchId}/documents/{documentId}` (+`?download=1`) từng vai trò.
- **Runtime LOCAL (`http://localhost:3000`, có service role key):** ✅ **19/19 pass** — chưa login 307;
  ADMIN inline/download 200 + đủ header; SECRETARY đúng scope 200; sai scope 404; PARENT 403; audit
  VIEW (Admin + SECRETARY) & DOWNLOAD (Admin) đúng actor; không rò bucket/path.
- **Runtime PRODUCTION (`summer-activities-theta.vercel.app`):** gating **đúng** (chưa login 307, SEC sai
  scope 404, PARENT 403) nhưng **ADMIN & SECRETARY đúng scope → 500**. Nguyên nhân: các path này gọi
  `createSupabaseAdminClient()` (service role) và **Vercel production thiếu `SUPABASE_SERVICE_ROLE_KEY`**
  → ném lỗi → 500. Đây là **thiếu cấu hình env production**, KHÔNG phải lỗi code (local 200). Cookie
  `@supabase/ssr` dựng đúng (production nhận diện đúng vai trò trước khi 500).

## 7. Header/security assertions (trong script HTTP)
| Trường hợp | Kỳ vọng |
|---|---|
| Chưa đăng nhập | 401/403 hoặc redirect login; **không** rò bucket/path |
| ADMIN inline | 200 · `Content-Type: image/png` · `Content-Disposition: inline` · `Cache-Control: no-store` · `X-Content-Type-Options: nosniff` |
| ADMIN `?download=1` | 200 · `Content-Disposition: attachment` |
| SECRETARY đúng scope | 200 · `no-store` + `nosniff` |
| SECRETARY sai scope | 403/404 · không rò path |
| PARENT | 403/404 · không rò path |

## 8. Audit view/download
- Script assert (service role đọc): `VIEW_AI_IMPORT_IMAGE` & `DOWNLOAD_AI_IMPORT_IMAGE` có `actor_id` =
  Admin smoke, `detail` chứa id lô nhưng **không** bucket/path/PII (regex kiểm `ai-import-uploads` + `/YYYY-MM-DD/`).
- Audit **append-only** (policy không cho xóa) → dòng smoke `SMOKE_09G_` **giữ lại** sau cleanup (ghi rõ).

## 9. Cleanup fixtures
- Mọi script xóa: `uploaded_documents`, storage binary, `import_batches`, `secretary_neighborhoods`,
  `profiles`, auth users, `neighborhoods`, `password_reset_requests` — theo prefix/id `SMOKE_09G_`.
- **Giữ lại:** dòng `audit_logs` (append-only). Prefix rõ ràng để rà tay nếu cần.

## 10. Health/preflight
- `/api/health.phase` = `09g-e2e-image-admin-assignment`.
- Cờ mới: `adminUiE2eReady`, `passwordRequestE2eReady`, `aiImageHttpSmokeReady`, `secretaryAssignmentReady`
  (giữ toàn bộ cờ cũ). **Không** expose secret.
- `npm run preflight`: ✅ OK (không secret tracked, không rò secret, không import mock, health phase mới).

## 11. Tests / deploy / git
- `node --check` 4 script mới: ✅ OK.
- `npm run preflight`: ✅ · `npm run lint`: ✅ · `npm run typecheck`: ✅ · `npm run build`: ✅ (exit 0).
- **RUNTIME smoke ĐÃ CHẠY THẬT** (có `.env.local`):
  - `smoke:admin-login` → **4/4 pass**.
  - `smoke:password-request` → **8/8 pass**.
  - `smoke:ai-image-http` (local) → **19/19 pass**.
  - `smoke:ai-image-http` (production) → gating đúng, nhưng ADMIN/SEC-in **500** (thiếu service role env).
- **Deploy:** không redeploy trong phiên này (không đổi runtime app; chỉ thêm script/health/docs). Health
  production vẫn phase `09f` cho tới lần deploy tới. **Ưu tiên trước deploy: set `SUPABASE_SERVICE_ROLE_KEY` trên Vercel.**
- Commit: chỉ stage file cụ thể (không `git add .`); không commit `.env`/secret/ảnh PII/`.next`.

## 12. Chưa làm
- Chưa **set `SUPABASE_SERVICE_ROLE_KEY` trên Vercel production** (route ảnh AI đang 500 ở prod).
- Chưa gán Khu phố thật cho 2 Bí thư (chờ Admin chỉ định — dry-run sẵn).
- Chưa redeploy production (health prod vẫn phase `09f` tới lần deploy tới).

## 13. Gợi ý bước tiếp theo
1. 🔴 **Set `SUPABASE_SERVICE_ROLE_KEY`** trên Vercel (Production) → redeploy → chạy lại
   `E2E_BASE_URL=https://summer-activities-theta.vercel.app npm run smoke:ai-image-http` để xác nhận ADMIN/SEC-in → 200.
2. Admin quyết định Khu phố cho 2 Bí thư → `npm run assign:secretaries` (DRY-RUN xem) → gán qua UI hoặc APPLY.
3. Sau khi set env + deploy → `curl /api/health` xác nhận phase `09g-...` + cờ mới `true`.

## 14. Các điểm dự án cần tu sửa thêm
- 🔴 **CAO — `SUPABASE_SERVICE_ROLE_KEY` chưa cấu hình trên Vercel production**: route ảnh AI (và mọi
  đường dùng service role: tải mẫu DOCX, một số action Admin) **500** trên prod. Set env + redeploy.
- **Route ảnh nên bắt lỗi service role → 503 thân thiện** thay vì để `createSupabaseAdminClient()` ném 500
  (defensive): trả "Kho lưu trữ chưa cấu hình" + log, tránh 500 trần cho người dùng.
- **CI E2E tự động**: đưa 3 smoke vào workflow chạy với secret GitHub (service role/base URL) để bắt hồi quy.
- **`src/modules/*` skeleton rỗng** (từ 10A) vẫn lệch `architecture.md` — chốt kiến trúc hoặc sửa docs.
- **Alert monitoring** (Slack/Telegram) khi healthcheck fail liên tiếp (mới có uptime check).
- **Retention `--apply` định kỳ** cho ảnh AI import (hiện dry-run thủ công).

## 15. Những việc không nên làm ngay
- Đổi RLS/schema hay public bucket ảnh chỉ để test dễ hơn (giữ private + RLS).
- Hardcode mật khẩu/secret vào script/CI để "chạy nhanh".
- Refactor lớn `src/modules/` hoặc UI polish toàn hệ thống trong lúc đang khoá E2E.
- Mở PDF AI import / đổi DOCX engine (ngoài phạm vi).

## 16. Codex review prompt
> Review PR 09G (chỉ thêm script E2E + health/docs, **không** đổi RLS/schema). Kiểm:
> 1. `e2e-ai-image-route-http-smoke.mjs` dựng cookie có **đúng** format `@supabase/ssr` v0.12 không
>    (`sb-<ref>-auth-token`, `base64-`+base64url, chunk `.0/.1` >3180)? Có rủi ro cookie không khớp
>    khiến route trả 403 giả (false-fail) không?
> 2. Các assert status/header (`no-store`, `nosniff`, `inline/attachment`, `image/png`) có khớp
>    `route.ts` hiện tại không? Có bỏ sót case redirect (middleware login) làm "chưa login" assert sai không?
> 3. `assign-secretaries-neighborhoods.mjs`: APPLY có giữ ràng buộc "1 Phụ trách chính/Khu phố" và
>    **không** gỡ phân công cũ ngoài chỉ định không? Audit actor có hợp lệ không?
> 4. `e2e-password-request-smoke.mjs`: có rò PII trong log/audit detail không? Cleanup có sót request/account?
> 5. Redaction (`safeMessage`) có che hết email/uuid/JWT/secret trong mọi nhánh lỗi không?
> 6. Có chỗ nào in mật khẩu/cookie/service role/path bucket không? Có hardcode secret không?
