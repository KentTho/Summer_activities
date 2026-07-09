# PROMPT 09E — Real Smoke + Password Reset Requests + Secretary Provisioning + Local AI Test

> Trạng thái: **PASS WITH WARNINGS**. Safe Execution Mode + Runtime Smoke Mode + Resume.
> Nhánh `main`. Migration additive `20260709010000` đã áp remote; types đã regenerate.

## 1. Mục tiêu
Hoàn tất 09E (bị interrupt): validate UUID route ảnh; 2 tài khoản Bí thư; luồng Quên mật khẩu →
Admin cấp lại; badge/alert Admin; test 3 ảnh local bằng Gemini; smoke session thật ở mức khả thi;
health phase 09e; dọn file tạm; validation/deploy/commit.

## 2. Resume status — đã làm gì trước interrupt
Trước interrupt đã hoàn tất phần code + smoke DB (đã xác minh qua working tree):
UUID validation, migration + RPC + RLS, data module, trang forgot-password, admin password-requests,
badge/alert/nav, highlight "chưa phân công", script provisioning + local-image test, health 09e,
2 tài khoản Bí thư đã tạo, smoke RPC/RLS/anti-spam đã chạy (script tạm `_smoke-prr.mjs` đã xóa).

## 3. Việc hoàn tất sau resume
- Chạy Gemini dry-run 3 ảnh (57 dòng) → report gitignored.
- Viết docs: `password-reset-requests.md`, cập nhật test-plan/progress/history/backlog + report này.
- Chạy lại preflight/lint/typecheck/build; deploy; commit.

## 4. File tạm đã xóa
- `scripts/_smoke-prr.mjs` (smoke RPC/RLS, chứa test identifier) — **đã xóa**, không commit.
- Ảnh `src/images/*` + `docs/reports/PROMPT-09E-local-images-ai-extraction.md` (**PII**) → **gitignored**,
  không commit.

## 5. UUID validation (route ảnh)
`.../documents/[documentId]/route.ts`: validate `batchId` & `documentId` bằng Zod `uuid()` **trước** khi
chạm DB — sai định dạng ⇒ 404 nhanh, không lộ path/bucket. Access control (ADMIN/SECRETARY-scope/PARENT)
giữ nguyên như 09D.

## 6. Hai tài khoản Bí thư
- 2 tài khoản Bí thư mới — tạo qua `scripts/provision-secretaries.mjs` (env `NEW_SECRETARY_ACCOUNTS_JSON`,
  **không** hardcode mật khẩu). role SECRETARY · active · staff_title "Bí thư" · `must_change_password=true` ·
  **chưa phân công Khu phố**. Smoke service-role xác nhận: 2 hồ sơ tồn tại, 0 phân công.
- Mật khẩu tạm: **ngẫu nhiên mạnh, không in/không commit**. Admin đặt lại mật khẩu tạm (hiển thị 1 lần)
  ở `/admin/secretaries` hoặc qua luồng Quên mật khẩu để user đăng nhập lần đầu.
- Highlight: `/admin/secretaries` hiện badge "⚠ Chưa phân công" mỗi tài khoản + dòng tổng cảnh báo.

## 7. Forgot password request flow
- Migration `password_reset_requests` (RLS **chỉ Admin** đọc/cập nhật; **không** insert policy).
- RPC `request_password_reset` **SECURITY DEFINER**: trung lập (void), chống spam 24h, best-effort khớp hồ sơ.
  Grant `anon, authenticated`.
- Public `/forgot-password?portal=user|admin` + link "Quên mật khẩu?" ở 2 cổng login. Thông báo trung lập.
- **Ghi chú thiết kế**: tạo yêu cầu do **anon** → không ghi `audit_logs` (RLS chặn anon; audit cần actor).
  Bản ghi yêu cầu (PENDING) chính là dấu vết. Audit chỉ ghi khi **Admin** xử lý (mục 8).

## 8. Admin reset / badge / notification
- `/admin/password-requests`: liệt kê PENDING trước; "Cấp mật khẩu tạm" (reuse `resetAuthPassword`,
  `must_change_password=true`, mật khẩu tạm hiện 1 lần) → RESOLVED; "Từ chối" → REJECTED.
- Audit `RESOLVE_PASSWORD_RESET_REQUEST` / `REJECT_PASSWORD_RESET_REQUEST` (actor Admin, chỉ id request/profile; không PII/mật khẩu).
- **Alert nổi bật**: banner đếm PENDING ở `/admin` + mục nav "Yêu cầu mật khẩu".

## 9. Local images Gemini extraction
- `npm run test:ai-local-images`: 3 ảnh `src/images` → **57 dòng**. Schema `full_name, birth_year, gender,
  confidence, notes`. birth_year/gender chỉ điền khi ảnh có (có ô "Chưa rõ" khi thiếu); **không** suy đoán
  giới tính từ tên; **không** insert DB.
- Report `docs/reports/PROMPT-09E-local-images-ai-extraction.md` — **gitignored** (PII).

## 10. Runtime smoke
- ✅ Forgot-password RPC (anon) tạo yêu cầu, thông báo trung lập.
- ✅ Anon **không** đọc được `password_reset_requests` (RLS) — trả 0 dòng.
- ✅ Anti-spam: gọi 2 lần cùng identifier → vẫn 1 PENDING.
- ✅ Yêu cầu của tài khoản tồn tại có `matched_profile_id`.
- ✅ 2 tài khoản Bí thư: SECRETARY/active/Bí thư, 0 phân công.
- ✅ Route công khai/bảo vệ (dev host): `/forgot-password`=200, `/admin/password-requests`=307→login,
  route ảnh UUID sai (chưa login)=307→login, `/api/health`=200 phase 09e.
- ⚠️ **NOT VERIFIED (thiếu dữ liệu ảnh AI trong DB)**: xem ảnh theo vai trò session thật (ADMIN/SECRETARY
  đúng-sai scope/PARENT) + audit view/download; Admin RESOLVE bằng UI session thật. Access control đã kiểm
  bằng RLS + build; cần seed ảnh AI để smoke đầy đủ (đề xuất 09F).

## 11. Health / preflight
- `/api/health` phase `09e-password-requests-real-smoke` + cờ `passwordResetRequestReady`,
  `secretaryProvisioningReady`, `realSessionImageSmokeReady`; giữ cờ cũ; không expose key.
- `preflight-check.mjs`: thêm `09d-…` vào OLD_PHASES. `check-production-health.mjs` EXPECT_PHASE = 09e.
  **PREFLIGHT OK.**

## 12. Tests / deploy / git
- `lint` sạch · `typecheck` sạch · `build` Compiled successfully (route `/forgot-password`,
  `/admin/password-requests` xuất hiện) · `git diff --check` sạch.
- Deploy production + commit: xem FINAL RESPONSE.

## 13. Chưa làm
- Smoke xem ảnh AI theo vai trò bằng session thật (thiếu dữ liệu ảnh trong DB).
- Gán Khu phố cho 2 Bí thư mới (chủ ý để Admin quyết định).
- Chưa tạo notification-row cho Admin (dùng dashboard alert/badge thay thế — đủ "nổi bật").

## 14. Gợi ý bước tiếp theo
- **09F**: seed 1 lô AI import + ảnh (qua Gemini thật hoặc fixture) rồi smoke xem/tải ảnh theo 4 vai trò +
  kiểm audit rows; đăng nhập Admin chạy RESOLVE một yêu cầu thật end-to-end; gán Khu phố cho 2 Bí thư.

## 15. Các điểm dự án cần tu sửa thêm
- `src/modules/*` phần lớn skeleton rỗng (logic ở `src/lib/*`) — 10A backlog.
- `README.md` còn ghi trạng thái cũ. CI chưa có test tự động (chỉ lint/typecheck/build).
- Cân nhắc gộp notification thật cho Admin (thay vì chỉ badge) khi có nhu cầu.

## 16. Những việc không nên làm ngay
- Không mở public bucket ảnh / signed URL ra client. Không nới RLS `password_reset_requests` cho anon đọc.
- Không tự gán Khu phố bừa cho tài khoản mới. Không commit ảnh/report PII/mật khẩu tạm.

## 17. Codex review prompt
> Bạn là Security Reviewer. Review 09E (chỉ báo cáo, không sửa):
> 1. RPC `request_password_reset` SECURITY DEFINER: có rò rỉ tồn tại tài khoản qua timing/side-effect? Khớp
>    hồ sơ (phone/email/synthetic) có sai vai trò-cổng không? Anti-spam 24h có bỏ sót? Có SQLi trong regexp?
> 2. RLS `password_reset_requests`: anon/user thường có đọc/ghi được không? Chỉ Admin? Insert chỉ qua RPC?
> 3. Route ảnh: UUID validate sớm có bỏ sót nhánh? Access control 09D còn nguyên (IDOR theo lô + bucket)?
> 4. Provisioning: có in/log/commit mật khẩu không? must_change_password chắc chắn? Không tự gán Khu phố?
> 5. Local-image test + ảnh: có commit PII không? Có suy đoán giới tính/năm sinh không? Không ghi DB?
> 6. Audit RESOLVE/REJECT có actor Admin, không PII/mật khẩu?
