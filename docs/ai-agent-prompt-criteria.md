# AI Coding Agent — Tiêu chí prompt (áp dụng cho dự án này)

> Bản rút gọn, áp dụng thực tế cho **Web-App Điểm danh sinh hoạt hè**.
> Bản đầy đủ/tổng quát: [`universal_ai_project_prompt_criteria.md`](./universal_ai_project_prompt_criteria.md).
> Bổ trợ: [`engineering-guardrails.md`](./engineering-guardrails.md), [`ai-code-security-gate.md`](./ai-code-security-gate.md),
> [`safe-deployment-checklist.md`](./safe-deployment-checklist.md).

## 1. Vai trò công cụ
- **Claude Code** — triển khai (đọc project, refactor nhiều file, UI/flow, chạy lệnh local có kiểm soát).
- **Codex** — review bảo mật sau khi triển khai (auth/RLS/scope, rò rỉ secret, đúng phạm vi).

## 2. Safe Execution Mode (bắt buộc mỗi prompt)
- Phạm vi nhỏ, rõ **được sửa / không được sửa**. Thiếu context ⇒ dừng, báo `BLOCKED`.
- **Preflight Git** trước khi sửa: `git status --short --branch`, `branch --show-current`, `log --oneline -20`, `remote -v`.
- **Validation trước & sau**: `npm run preflight && lint && typecheck && build` + `git diff --check`.
- **Runtime smoke** nếu đổi runtime/route/behavior (unauthorized → success → cross-scope → cleanup).
- Static PASS ≠ runtime PASS. Không ghi "DONE runtime" nếu mới chỉ build.

## 3. Secret/env
- **Không mở/in** `.env`/`.env.local` thật; chỉ kiểm tra **biến tồn tại** + `git check-ignore`.
- Không in service role key / `GEMINI_API_KEY` / token / password. Không đưa secret vào report.
- Không hardcode fallback secret.

## 4. Database / production
- Không reset remote DB, không drop table, không disable RLS, không `using(true)`.
- Migration chỉ **additive**, có lý do rõ. Không dùng production DB cho smoke test.

## 5. Bảo mật đặc thù dự án
- Auth **trong route handler/server action**, không dựa layout. RBAC + scope (Khu phố/lô) ở **query**, không chỉ UI.
- Cross-scope trả **404/403** theo convention. Bucket ảnh/tệp **PRIVATE** — không public URL, không trả path ra client.
- Không log họ tên/SĐT/ảnh/base64/key/token. Storage bằng service role **chỉ sau** khi đã xác thực quyền.

## 6. Git / commit
- **Không `git add .`** — stage đúng danh sách file. Review `git diff --cached --name-only` + `--check` trước commit.
- Không có `.env`/build artifact/`node_modules`/`.next`/ảnh thật trong staged.

## 7. Report mỗi prompt (không docs-heavy)
Mục tiêu → file đã sửa → validation → runtime smoke → không đổi gì → rủi ro còn lại →
**next step** + **điểm cần tu sửa thêm**. Trạng thái: `PASS / PASS WITH WARNINGS / NEEDS FIX / BLOCKED`.
