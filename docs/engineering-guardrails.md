# Engineering Guardrails (chọn lọc)

> Thêm ở **Prompt 07**. Đây là **nguyên tắc/guardrail** rút gọn từ các ghi chú thực tế,
> KHÔNG phải tính năng phải build. Giữ ngắn, thực thi được. Bổ trợ cho:
> `security.md` (session/JWT/AI), `devops-deploy-rollback-backup.md`, `ai-security-checklist.md`.

## 1. Session / JWT / Auth / Zero Trust

- **Không tin client.** Quyết định bảo mật ở server (`auth.getUser()` xác minh với Auth
  server) + **RLS Postgres** là chặn cuối. UI/middleware chỉ là lớp tiện lợi. → Zero-Trust:
  mỗi request tự chứng minh danh tính + quyền, không dựa "đã qua cổng nên tin".
- **JWT ngắn hạn + refresh token.** Không tự parse JWT ở client để phân quyền; luôn hỏi
  Auth server / để RLS quyết định.
- **Logout = thu hồi phía server** (`signOut()` huỷ refresh token), không chỉ xoá cookie.
- **Token version / "đăng xuất mọi thiết bị" (khi cần):** nếu sau này cần vô hiệu hoá phiên
  hàng loạt (đổi mật khẩu, nghi lộ token), dùng cơ chế token-version/`session_not_before`
  của Supabase hoặc cột version trong `profiles` để từ chối token cũ. **Chưa bật** — ghi chú
  để cân nhắc, không build vội.
- **Service role JWT** bỏ qua RLS → chỉ dùng server-side trong script; **không** ở user-facing
  action (đã tuân thủ: mọi CRUD/attendance/leave đi qua RLS).

## 2. DevOps / CI-CD / Rollback / Backup / Monitoring

Chi tiết ở `devops-deploy-rollback-backup.md`. Guardrail cốt lõi bổ sung:

- **"No Deploy Friday" (và cuối ngày):** tránh deploy thay đổi rủi ro sát cuối tuần/cuối ngày
  khi khó ứng cứu. Hotfix nhỏ + có rollback rõ ràng thì ngoại lệ.
- **CI phải xanh trước khi merge:** typecheck + lint + build (đang chạy tay mỗi prompt; khi có
  CI thì chặn merge nếu đỏ). Không "sửa cho qua CI" bằng cách tắt kiểm tra.
- **Mọi thay đổi phải có đường lùi:** deploy immutable (Vercel instant rollback) + migration
  additive/idempotent (đã tuân thủ ở 06A/07). Không `db reset`/drop trên production.
- **Monitoring tối thiểu:** `/api/health` + log lỗi server (không log PII/secret).

## 3. Debugging / Load testing / SDLC / Phối hợp BA–Dev–Tester

- **Debug đúng gốc:** tái hiện → khoanh vùng (RLS? validation? data?) → sửa nguyên nhân, không
  vá triệu chứng. Ghi sự cố + cách sửa vào report (đã làm: lỗi RLS `insert().select()` ở 07).
- **RLS là điểm dễ sai nhất** ở app này: luôn test bằng **client đăng nhập thật** (không chỉ
  service role) — service role bỏ qua RLS nên "chạy được" mà vẫn sai quyền. (07 có smoke test
  ký tên Bí thư + Phụ huynh.)
- **Load testing (khi cần):** buổi/điểm danh có thể ghi dồn cuối buổi; nghĩ về index (đã có
  index `attendance_records(session_id)`), tránh N+1 (data layer gộp truy vấn theo id).
- **SDLC gọn:** yêu cầu rõ (prompt) → guardrail → build lát mỏng thật → test → docs → deploy.
  Không nhồi nhiều nghiệp vụ chưa chốt.
- **BA–Dev–Tester:** định nghĩa "done" phải gồm **định nghĩa trạng thái** (vd điểm danh:
  PRESENT/EXCUSED/UNEXCUSED/NOT_MARKED) + **luật quyền** (ai được làm gì) trước khi code.

## 4. AI / "vibe coding" / System design / Git / DB / API

- **AI/OCR:** xem `ai-security-checklist.md`. Output AI là *gợi ý*, qua **duyệt tay** trước khi
  ghi thật; key AI chỉ ở server.
- **Chống "vibe coding" (code theo cảm tính):** không copy code không hiểu; đọc guide phiên bản
  (Next.js trong `node_modules/next/dist/docs` — repo này khác bản thường); mỗi thay đổi phải
  typecheck/lint/build + test hành vi thật (không tin "trông có vẻ chạy").
- **System design:** giữ ranh giới module (`src/modules/*` domain, `src/lib/data/*` truy cập DB,
  Server Actions cho ghi). Denormalize có chủ đích (vd guardian lên students cho MVP), ghi rõ.
- **Git:** commit nhỏ, Conventional Commits, không commit secret/`.env.local`/`.vercel`. Branch
  cho việc rủi ro; revert thay vì reset trên nhánh chung.
- **Database:** migration là nguồn sự thật của schema; additive-first; RLS deny-by-default,
  không `using(true)` ở bảng dữ liệu cá nhân; hàm quyền dùng `SECURITY DEFINER` để tránh đệ quy
  RLS (vd `is_guardian_of_session` ở 07).
- **API/Server Actions:** validate lại bằng Zod ở server (không tin input client); whitelist field
  chống mass-assignment; thông báo lỗi trung lập, không lộ chi tiết nhạy cảm; không log PII học sinh.
