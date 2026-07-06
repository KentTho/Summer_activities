# Báo cáo PROMPT 07 — Attendance workflow + Leave requests + Engineering guardrails

- **Ngày:** 2026-07-07
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-06B-bootstrap-ocr-import-security-devops-report.md`
- **Phạm vi:** điểm danh thật (tạo buổi → điểm danh 4 trạng thái → sửa/chốt), xin nghỉ thật
  (phụ huynh gửi → Bí thư duyệt/từ chối → gợi ý EXCUSED), dashboard Bí thư/Phụ huynh + admin
  sessions đọc thật, và docs guardrails từ 4 nhóm ghi chú.
  **Không** DOCX/Notification thật; **không** nâng cấp UI lớn; **không** reset/seed production;
  **không** disable/nới RLS bằng `using(true)`; **không** service role ở user-facing action.

---

## A — Đọc lại trạng thái + rà guardrails (Phần A)

- Đọc `PROJECT_PROGRESS.md`, `IMPLEMENTATION_HISTORY.md`, schema/RLS 04B, report 05/06A/06B.
- 4 nhóm ghi chú thực tế: session/JWT/Zero-Trust, DevOps/rollback/monitoring, AI security đã có
  một phần trong `security.md` + `devops-deploy-rollback-backup.md` + `ai-security-checklist.md`.
  **Thiếu:** No-Deploy-Friday/CI, debugging/load-test/SDLC/BA-Dev-Tester, vibe-coding/system-design/
  git/db/api, token-version/zero-trust → gom vào **`docs/engineering-guardrails.md`** (chọn lọc).

## B — Migration (ADDITIVE, đã áp remote + gen types)

| Migration | Nội dung |
| --- | --- |
| `20260706010000_session_lifecycle` | `activity_sessions.closed_at`; sửa deadlock `snb_insert` (người tạo gắn Khu phố trong phạm vi) |
| `20260706020000_sessions_select_creator` | `sessions_select` + nhánh `created_by = current_profile_id()` |
| `20260706030000_guardian_session_visibility` | helper `is_guardian_of_session` (SECURITY DEFINER) + phụ huynh xem buổi/Khu phố của con |

Tất cả: **không** drop bảng/cột, **không** disable RLS, **không** `using(true)`. Áp bằng
`supabase db push` (CLI đã cache credential từ lần link trước) → `gen types --linked`.

## C — Attendance workflow (yêu cầu 4)

- Data: `src/lib/data/sessions.ts` — `listSessions` (kèm Khu phố + đếm CM/CP/KP), `getSessionDetail`,
  `getSessionRoster` (học sinh trong Khu phố của buổi + trạng thái, null = chưa điểm danh).
- Actions `sessions/actions.ts`: `createSession` (**sinh id client-side** để né lỗi RLS
  returning-select; gắn `session_neighborhoods`), `closeSession`/`reopenSession`.
- Actions `attendance/actions.ts`: `markAttendance` — upsert PRESENT/EXCUSED/UNEXCUSED;
  **NOT_MARKED = xóa bản ghi**; **khóa sửa khi buổi đã chốt** (`closed_at`).
- UI: `sessions/page.tsx` (+`CreateSessionForm`), `sessions/[sessionId]/page.tsx` (roster 4 nút
  điểm danh server-render + chốt/mở lại), `attendance/page.tsx` (chọn buổi để điểm danh, ưu tiên hôm nay).
- 4 trạng thái đúng yêu cầu: **PRESENT / EXCUSED (nghỉ có phép) / UNEXCUSED (nghỉ không phép) /
  NOT_MARKED (chưa điểm danh)**. DB enum giữ nguyên (EXCUSED/UNEXCUSED); NOT_MARKED không lưu.

## D — Leave requests (yêu cầu 5)

- Phụ huynh: `parent/leave-requests` (`SubmitLeaveForm` + `submitLeaveRequest`) — chọn con + buổi
  (tùy chọn) + lý do. RLS `leave_insert` chỉ cho phụ huynh của học sinh (is_guardian_of).
- Bí thư: `secretary/leave-requests` — danh sách thật (`lib/data/leave.ts`) + `acknowledgeLeave`/
  `rejectLeave`. **Duyệt → upsert điểm danh EXCUSED** cho đúng buổi nếu buổi còn mở (gợi ý, sửa được).

## E — Dashboards thật (yêu cầu 6–8)

- Bí thư (`secretary-dashboard.ts`): buổi hôm nay/sắp tới, **số HS cần điểm danh hôm nay**,
  CM/CP/KP tháng + **tỉ lệ tham gia**. Cổng Phụ huynh (`parent.ts`): lịch sinh hoạt (RLS),
  đơn xin nghỉ, lịch sử điểm danh (đếm CM/CP/KP). Admin `sessions` đọc thật (read-only).

## F — Kiểm thử (yêu cầu 11–12)

| Bước | Kết quả |
| --- | --- |
| `npm run typecheck` / `lint` / `build` | ✅ Pass (route mới `/user/secretary/sessions/[sessionId]`) |
| Guard route bảo vệ (chưa đăng nhập) | ✅ Middleware redirect login (đã có từ 05, không đổi) |
| **Smoke test RLS ký tên thật** (Bí thư + Phụ huynh tạm) | ✅ Xem bảng dưới |

**Smoke test end-to-end (client đăng nhập thật, không service role cho thao tác):**
- Bí thư tạo học sinh · tạo buổi (id client-side) · **gắn Khu phố (snb_insert fix)** · thấy buổi
  của mình · **điểm danh PRESENT** → OK.
- Phụ huynh tạm (tạo bằng service role rồi **xóa sau**): **gửi xin nghỉ (is_guardian_of)** · chỉ
  thấy học sinh liên kết (count=1) · **thấy buổi + Khu phố của con** → OK.
- Bí thư: thấy đơn · **duyệt → attendance EXCUSED** · Phụ huynh thấy trạng thái `EXCUSED` · **chốt buổi** → OK.
- **Dọn sạch:** DB trở lại 2 profiles / 0 bản ghi nghiệp vụ (đã kiểm đếm).

**Sự cố đã xử lý (đúng gốc, ghi lại):**
1. `insert().select()` buổi mới bị RLS chặn ở **returning-select** (buổi chưa có link Khu phố →
   `can_access_session`=false). Sửa: sinh id client-side + policy `created_by` cho `sessions_select`.
2. `is_secretary()` đúng (true) nhưng insert vẫn lỗi → xác định là do returning-select ở trên.
3. Phụ huynh không thấy buổi: nhánh join `session_neighborhoods` trong `sessions_select` chịu RLS
   của bảng đó (snb_select không cấp phụ huynh) → helper **SECURITY DEFINER** `is_guardian_of_session`.
4. Lint `react/no-children-prop`: đổi tên prop `children` → `kids` trong `SubmitLeaveForm`.

## G — Docs guardrails (yêu cầu 2–3)

`docs/engineering-guardrails.md` — 4 nhóm, chọn lọc: (1) Session/JWT/Zero-Trust/logout/token-version;
(2) DevOps/CI/No-Deploy-Friday/rollback/monitoring; (3) Debugging/RLS-testing/load/SDLC/BA-Dev-Tester;
(4) AI/vibe-coding/system-design/git/db/api. Trỏ chéo `security.md`, `devops-deploy-rollback-backup.md`,
`ai-security-checklist.md`. **Là guardrail, không phải tính năng** (đúng yêu cầu, không lan man).

## H — Tuân thủ quy tắc

- ✅ Không DOCX/Notification thật; không nâng cấp UI lớn; không phá Auth/RBAC/CRUD/OCR.
- ✅ Migration **additive**, không drop/không disable RLS, không `using(true)`; áp remote an toàn.
- ✅ Attendance/Leave đi qua **RLS** bằng server client; service role **chỉ** trong smoke test (dọn sạch).
- ✅ Bí thư chỉ tạo/điểm danh buổi Khu phố phụ trách; Phụ huynh chỉ xem/gửi cho con liên kết (đã test).
- ✅ Không log PII học sinh; thông báo lỗi trung lập; validate Zod ở server.
- ✅ Không commit `.env.local`/`.vercel`/`supabase/.temp`/secret/OCR key/DB password.
