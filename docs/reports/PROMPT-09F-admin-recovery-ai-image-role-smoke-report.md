# PROMPT 09F — Admin Access Recovery + Real Image Role Smoke + Secretary Assignment

> Trạng thái: **PASS**. Safe Execution Mode + Runtime Smoke Mode + Break-glass Admin Recovery.
> Nhánh `main`. Không đổi RLS/schema. Không migration mới.

## 1. Mục tiêu
Chẩn đoán vì sao Admin không đăng nhập được; thêm cơ chế khôi phục Admin an toàn (không lẫn forgot-password
công khai); smoke session thật cho đăng nhập Admin + phân quyền route ảnh 4 vai trò; xác nhận trạng thái 2
Bí thư mới; cập nhật docs/health/report.

## 2. Nguyên nhân Admin không vào được
Chẩn đoán bằng `node --env-file=.env.local scripts/recover-admin-account.mjs` (chế độ chẩn đoán, không đổi gì):

| Kiểm tra | Kết quả | Kết luận |
| --- | --- | --- |
| Auth user `Admin` (email `admin@sinhhoathe.local`) | **có**, `email_confirmed=true` | Tồn tại |
| `must_change_password` | **false** | KHÔNG bị ép đổi mật khẩu / không redirect loop |
| Profile | `role=ADMIN`, `active=true` | Hồ sơ hợp lệ |
| Mapping identifier | `Admin → admin@sinhhoathe.local` | Đúng |

➡️ **Admin gốc khỏe mạnh** — nguyên nhân không đăng nhập được là **sai mật khẩu** (không phải lỗi hệ thống,
không phải forced-change). Vì vậy dùng "Quên mật khẩu" công khai là **không phù hợp** cho Admin.

## 3. Admin recovery script
`scripts/recover-admin-account.mjs` (+ `npm run recover:admin`):
- **Chẩn đoán** (mặc định khi không có `ADMIN_RECOVERY_PASSWORD`): in trạng thái + chẩn đoán nguyên nhân.
- **Đặt lại**: env `ADMIN_RECOVERY_IDENTIFIER` (mặc định `Admin`), `ADMIN_RECOVERY_PASSWORD` (bắt buộc để đổi),
  `ADMIN_RECOVERY_FORCE_CHANGE` (mặc định `false` → vào thẳng `/admin`). Đảm bảo `role=ADMIN`, `active=true`,
  `email_confirm`. **Không hardcode/không in mật khẩu**; service role chỉ chạy local/máy chủ.
- Docs `docs/admin-access-recovery.md` (nêu rõ: không xem được mật khẩu cũ, chỉ đặt lại).

## 4. Admin login UX fix
`/admin/login`: **bỏ** link "Quên mật khẩu?" công khai; thay bằng chỉ dẫn *"Không vào được tài khoản Admin?
Dùng quy trình khôi phục Admin trên máy chủ (`npm run recover:admin`)"*. Giữ `/forgot-password` cho
Bí thư/Phụ huynh. Form vẫn nhận `portal=admin` (hệ thống nhiều Admin) nhưng **không** nổi bật.

## 5. Admin login smoke (session thật, tài khoản disposable)
Tạo tài khoản `SMOKE_09F` ADMIN tạm (must_change_password=true) → test qua Auth API rồi **xóa**:
- ✓ Sai mật khẩu → đăng nhập lỗi.
- ✓ Đúng mật khẩu → thành công; `must_change_password=true` ⇒ sẽ vào `/change-password`.
- ✓ Session thật đọc được hồ sơ `role=ADMIN` (RLS).
- ✓ `auth.updateUser` đổi mật khẩu → `must_change_password=false` ⇒ vào `/admin`.
**6/6 pass**, không in mật khẩu, cleanup sạch. (Không đụng Admin gốc.)

## 6. Trạng thái 2 Bí thư mới
`0944577905`, `0368103532`: `role=SECRETARY`, `active=true`, `staff_title=Bí thư`, **assignments=0** (vẫn
**chưa phân công**). **Không tự gán** (user chưa chỉ định Khu phố). `/admin/secretaries` đã highlight
"⚠ Chưa phân công" + dòng tổng cảnh báo (từ 09E). ➡️ **Cần Admin gán Khu phố** qua `/admin/secretaries`.

## 7. AI image role smoke (session thật)
`scripts/smoke-ai-image-route.mjs` — seed fixtures `SMOKE_09F_` (2 Khu phố, 4 user Admin/SecIn/SecOut/Parent,
1 lô AI, 1 ảnh 1×1 PNG **không PII** vào bucket private), test **gate của route** bằng **JWT người dùng thật**
(RLS áp đúng như route), rồi **cleanup toàn bộ**:
- ✓ SECRETARY đúng scope THẤY lô (→ route 200).
- ✓ SECRETARY sai scope KHÔNG thấy lô (→ route 404).
- ✓ PARENT bị chặn bởi role (route 403) & không thấy lô.
- ✓ ADMIN thấy lô (→ route 200).
- ✓ Chưa đăng nhập không thấy lô (RLS `authenticated`).
- ✓ Ảnh ràng buộc ĐÚNG `import_batch_id` + bucket → âm tính với lô khác (**chống IDOR**).
- ✓ Đọc được nhị phân ảnh private bằng service role (sau khi đã có quyền lô).
**8/8 pass**, cleanup sạch (không còn fixtures `SMOKE_09F_`).

> Ghi chú: smoke kiểm **đúng lớp phân quyền** của route (role + RLS scope + doc binding) bằng session thật.
> Lớp HTTP/cookie + `Content-Disposition` đã được build + kiểm ở 09D; block chưa-đăng-nhập kiểm live = 307→login.

## 8. Audit view/download
Route ghi `VIEW_AI_IMPORT_IMAGE` / `DOWNLOAD_AI_IMPORT_IMAGE` qua `logAudit` (actor = người xem) — đường ghi
audit đã xác minh hoạt động ở prod (RESOLVE/REJECT ở 09E ghi thật). Smoke 09F **không** chèn audit rác vì
`audit_logs` **append-only** (không có policy delete) — tránh làm bẩn log bất biến. ➡️ Audit verified-by-code.

## 9. Health / preflight
- `/api/health` phase `09f-admin-recovery-image-smoke` + cờ `adminRecoveryReady`, `adminLoginSmokeReady`,
  `aiImageRoleSmokeReady`; giữ cờ cũ; không expose key.
- `preflight-check.mjs`: thêm `09e-…` vào OLD_PHASES. `check-production-health.mjs` EXPECT_PHASE = 09f.

## 10. Tests / deploy / git
- preflight OK · lint sạch · typecheck sạch · build Compiled successfully · `node --check` 2 script mới OK ·
  `git diff --check` sạch. Smoke: admin-login 6/6 · image-role 8/8 · recover diagnose OK · secretary status OK.
- Deploy prod + commit: xem FINAL RESPONSE.

## 11. Chưa làm
- Gán Khu phố cho 2 Bí thư (chủ ý để Admin quyết định).
- Smoke route ảnh qua **HTTP + cookie thật** end-to-end (sandbox không tới được dev host; đã kiểm lớp phân
  quyền bằng JWT thật + block live 307). Audit view/download qua HTTP thật chưa chèn (tránh làm bẩn log).
- Admin RESOLVE 1 yêu cầu mật khẩu qua UI session thật (đã kiểm data-layer ở 09E).

## 12. Gợi ý bước tiếp theo
- **09G**: (1) Admin đăng nhập UI thật (sau recover) gán Khu phố cho 2 Bí thư + RESOLVE 1 yêu cầu end-to-end,
  kiểm audit rows; (2) nếu cần bằng chứng HTTP-by-role, thêm harness E2E dùng cookie `@supabase/ssr` chạy
  trên host (Playwright/PowerShell) để bắt `Content-Disposition`/status + audit.

## 13. Các điểm dự án cần tu sửa thêm
- `src/modules/*` phần lớn skeleton rỗng (logic ở `src/lib/*`) — 10A backlog. `README.md` còn trạng thái cũ.
- CI chưa có test tự động; nên đưa `smoke-ai-image-route.mjs` (fixtures + cleanup) vào job có secret riêng.
- Cân nhắc notification-row cho Admin thay vì chỉ badge (khi cần).

## 14. Những việc không nên làm ngay
- Không đặt mật khẩu Admin cố định trong source/report/script. Không mở public bucket ảnh / signed URL.
- Không tự gán Khu phố cho tài khoản mới. Không nới RLS. Không chèn audit rác vào log bất biến.

## 15. Codex review prompt
> Bạn là Security Reviewer. Review 09F (chỉ báo cáo, không sửa):
> 1. `recover-admin-account.mjs`: có in/log/commit mật khẩu-secret? Chế độ chẩn đoán có rò rỉ gì? Reset có
>    đảm bảo role ADMIN/active và set `must_change_password` đúng env? Có import service role vào client không?
> 2. Admin login UX: đã bỏ forgot công khai ở `/admin/login`? `/forgot-password` cho user còn nguyên?
> 3. `smoke-ai-image-route.mjs`: fixtures có prefix + cleanup đầy đủ (users/auth/batch/doc/storage/KP)? Có
>    dùng JWT thật (không service role) cho phần kiểm quyền? Kết luận 200/404/403 có ánh xạ đúng gate route?
> 4. Có commit ảnh/PII/mật khẩu/script tạm `_smoke-*`? `.gitignore` che `src/images` + report PII?
> 5. Health/phase: lộ key không? Cờ mới có phản ánh đúng bằng chứng smoke không?
