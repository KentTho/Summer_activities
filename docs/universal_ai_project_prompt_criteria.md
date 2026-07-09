# BỘ TIÊU CHÍ PROMPT PHÁT TRIỂN DỰ ÁN BẰNG AI

> Phiên bản: 1.0
> Mục đích: dùng làm **form tiêu chuẩn** cho mọi dự án phần mềm khi làm việc với AI coding agent như Claude Code, Codex, Cursor, Copilot Agent hoặc agent trong IDE.
> Nguyên tắc chính: **rõ phạm vi, an toàn trước, sửa nhỏ, kiểm chứng thật, không làm bừa, không lộ secret, không phá production.**

---

## 1. Khi nào dùng tài liệu này?

Dùng tài liệu này khi bạn muốn AI:

- Audit dự án.
- Tổ chức lại cấu trúc thư mục/tệp.
- Refactor code.
- Fix bug.
- Hardening bảo mật.
- Cleanup env/config.
- Tách module/controller/service/repository.
- Chạy validation/build/test.
- Chuẩn bị deploy.
- Viết prompt tiếp theo cho Claude Code/Codex.

Không dùng tài liệu này như một prompt “làm hết tất cả”. Hãy chia nhỏ theo phase.

---

## 2. Nguyên tắc cốt lõi

### 2.1. PRD rõ trước khi code

Trước khi sửa source, AI phải hiểu rõ:

- Mục tiêu là gì.
- Phạm vi được sửa là gì.
- Phạm vi không được sửa là gì.
- Kết quả mong muốn là gì.
- Validation cần chạy là gì.
- Điều kiện dừng là gì.

Nếu thiếu context quan trọng, AI phải dừng và báo `BLOCKED`, không tự đoán.

---

### 2.2. Safety gate trước mọi thay đổi

Trước khi sửa code, bắt buộc kiểm tra:

```bash
git status --short --branch
git branch --show-current
git log --oneline -20
git remote -v
```

Quy tắc:

- Không sửa source nếu chưa có Git/checkpoint/backup rõ ràng.
- Không commit vào `main`/`master` nếu chưa được yêu cầu rõ.
- Không dùng `git add .`.
- Chỉ stage đúng danh sách file cần commit.
- Không push remote nếu chưa được yêu cầu.
- Nếu working tree có thay đổi lạ: dừng và báo.

---

### 2.3. Bảo mật secret/env tuyệt đối

AI không được:

- Mở hoặc in nội dung `.env` thật.
- In `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, API key, token, password.
- Commit `.env`, `.env.local`, secret file, log chứa secret.
- Tạo fallback secret hard-code trong code.
- Đưa secret vào report.

AI được phép:

- Đọc `.env.example`.
- Kiểm tra file env có tồn tại hay không.
- Kiểm tra env có bị Git track/stage không.
- Ghi tên biến env cần có, nhưng không ghi giá trị thật.

Lệnh kiểm tra nên dùng:

```bash
git check-ignore .env
git check-ignore backend/.env
git check-ignore dashboard/.env.local
git ls-files | rg "(^|/)\.env$|\.env\.local$|\.env\.production$|\.env\.development$"
```

---

### 2.4. Không phá database / production

Không được chạy nếu chưa có yêu cầu rõ và chưa có backup:

```bash
prisma db push
prisma db push --accept-data-loss
prisma migrate reset
DROP DATABASE
TRUNCATE
DELETE hàng loạt không điều kiện
docker compose up trên production
start-all script có side effect
```

Quy tắc DB:

- Ưu tiên DB local/test.
- Không dùng production DB cho smoke test.
- Migration phải có backup/rollback plan.
- Nếu chỉ static validation thì không đánh dấu runtime PASS.
- Nếu tạo test data thì phải có prefix rõ và cleanup sau test.

---

### 2.5. Không gom nhiều refactor rủi ro vào một prompt

Mỗi prompt chỉ nên xử lý một nhóm việc rõ ràng:

- Một route group.
- Một feature page.
- Một repository layer.
- Một bug cụ thể.
- Một nhóm env/config.
- Một nhóm security guard.

Không làm cùng lúc:

- Refactor lớn + schema migration + UI rewrite + deploy.
- Xóa code + đổi behavior + đổi database + đổi config.
- Cleanup toàn repo khi chưa có audit map.

---

### 2.6. Bảo toàn behavior hiện tại

Khi refactor:

- Public route không đổi nếu không được yêu cầu.
- Method không đổi.
- Auth middleware không giảm.
- Response shape không đổi nếu chưa có migration contract.
- Error status không đổi trừ khi fix bug được approve.
- Không đổi business logic ngoài phạm vi.

Nếu phải đổi behavior, AI phải ghi rõ:

- Behavior cũ.
- Behavior mới.
- Lý do đổi.
- Cách validate.

---

### 2.7. Static validation không đồng nghĩa runtime PASS

Phải phân biệt rõ:

| Loại kiểm tra | Ý nghĩa |
|---|---|
| Syntax/type/build PASS | Code có thể compile/build |
| Unit test PASS | Logic nhỏ đã test |
| Runtime smoke PASS | API/flow thật đã chạy trong local/test |
| Production ready | Cần thêm deploy, monitoring, rollback, backup |

Không được ghi `DONE runtime` nếu chỉ mới chạy `node --check`, `tsc`, `build`.

---

### 2.8. Last-mile validation bắt buộc

Sau khi sửa source, tối thiểu cần chạy:

Backend thường dùng:

```bash
node --check <file>
npx prisma validate
git diff --check
git diff --name-status
```

Frontend thường dùng:

```bash
npx --no-install tsc --noEmit
npm run --if-present build
git diff --check
```

Nếu có API/runtime change, cần smoke test:

- No-token/unauthenticated case.
- Authorized success case.
- Permission denied case nếu có RBAC/tenant.
- Regression route quan trọng.
- Cleanup test data.

---

### 2.9. AI không được “Accept All” mù quáng

Trước khi commit, AI phải review:

```bash
git diff --stat
git diff --name-status
git diff --check
git diff --cached --name-only
git diff --cached --check
```

AI phải xác nhận:

- File thay đổi đúng phạm vi.
- Không có `.env`.
- Không có build artifact.
- Không có `node_modules`, `.next`, logs, uploads.
- Không có migration/schema ngoài scope.
- Không có package file ngoài scope.

---

### 2.10. Report vừa đủ, không docs-heavy

Mỗi prompt nên có report ngắn đủ truy vết:

- Mục tiêu.
- File đã sửa.
- Validation đã chạy.
- Runtime smoke nếu có.
- Không thay đổi gì.
- Rủi ro còn lại.
- Next step.

Nếu prompt là code cleanup mà docs/report nhiều hơn source quá nhiều, cần báo `docs-heavy` và giảm tài liệu ở prompt sau.

---

## 3. Tool routing chung

| Tool | Dùng khi nào |
|---|---|
| ChatGPT | Tạo prompt, review report, lập kế hoạch, tổng hợp tiêu chí, viết checklist. |
| Claude Code CLI | Refactor nhiều file, frontend flow phức tạp, đọc project sâu, xử lý UI state, chạy lệnh local có kiểm soát. |
| Codex | Backend refactor, repository layer, security hardening, validation, Git commit, task kỹ thuật có phạm vi rõ. |
| Claude Design / UI tool | Wireframe, mockup, redesign visual trước khi code. |
| IDE agent | Sửa code nhỏ, grep, rename, chạy test trong workspace. |

Nguyên tắc chọn tool:

- Code backend/security: ưu tiên Codex hoặc Claude Code.
- UI/UX component lớn: ưu tiên Claude Code, nếu cần visual thì Claude Design trước.
- Prompt/roadmap/checklist: dùng ChatGPT.
- Không dùng model mạnh cho task chỉ cần docs nhỏ.

---

## 4. Form prompt tiêu chuẩn

Copy form dưới đây cho các dự án khác và điền phần trong ngoặc vuông.

```txt
PROMPT [SỐ] — [TÊN TASK RÕ RÀNG]

Bạn là [vai trò: Senior Backend Engineer / Full-stack Refactor Engineer / Security Engineer / DevOps Engineer / UI Engineer].

NGÔN NGỮ OUTPUT:
Toàn bộ ghi chú, report và final response viết bằng [TIẾNG VIỆT / ENGLISH].

CHẾ ĐỘ LÀM VIỆC:
[Safe Execution Mode / Lean Execution Mode / Read-only Audit Mode / Runtime Smoke Mode]

BỐI CẢNH:
- Dự án: [tên dự án]
- Stack: [backend/frontend/database/deploy]
- Trạng thái gần nhất: [prompt/report/commit trước]
- Vấn đề hiện tại: [mô tả ngắn]
- Mục tiêu dài hạn: [sản phẩm/kiến trúc/deploy]

MỤC TIÊU PROMPT NÀY:
1. [Mục tiêu 1]
2. [Mục tiêu 2]
3. [Mục tiêu 3]

PHẠM VI ĐƯỢC SỬA:
- [file/folder/feature được sửa]

PHẠM VI KHÔNG ĐƯỢC SỬA:
- Không sửa [schema/migrations/env/package/deploy/webhook/etc]
- Không đổi [public API/route/response/auth] nếu chưa được yêu cầu.

QUY TẮC AN TOÀN BẮT BUỘC:
- Không dùng git add .
- Không push remote.
- Không mở/in .env thật.
- Không in secret/token/password.
- Không chạy db push --accept-data-loss.
- Không dùng production DB.
- Không sửa ngoài phạm vi.
- Nếu thiếu context hoặc có thay đổi lạ: DỪNG và báo BLOCKED.

PHASE 0 — PREFLIGHT
Chạy:
- git status --short --branch
- git branch --show-current
- git log --oneline -20
- git remote -v
- git check-ignore .env
- git ls-files | rg "(^|/)\.env$|\.env\.local$|\.env\.production$|\.env\.development$"

Điều kiện dừng:
- Nếu đang ở main/master mà chưa được phép.
- Nếu .env bị tracked/staged.
- Nếu working tree có source change lạ.

PHASE 1 — ĐỌC CONTEXT
Đọc các file:
- [docs/report trước]
- [file source liên quan]
- [schema/config nếu cần]

Không mở env thật.

PHASE 2 — BASELINE VALIDATION
Chạy các lệnh phù hợp:
- [backend syntax/type/prisma]
- [frontend type/build]
- [test nếu có]

Ghi rõ PASS/FAIL/BLOCKED.

PHASE 3 — MAP HIỆN TRẠNG
Trước khi sửa, lập bảng:
| File/Route/Module | Hiện trạng | Rủi ro | Hành động đề xuất |
|---|---|---|---|

Không sửa trước khi map xong.

PHASE 4 — ÁP PATCH NHỎ
Sửa đúng phạm vi.
Không format toàn file nếu không cần.
Không đổi behavior ngoài mục tiêu.

PHASE 5 — VALIDATION SAU PATCH
Chạy:
- [lệnh syntax/type/build]
- git diff --check
- git diff --stat
- git diff --name-status

Nếu fail:
- Sửa nếu nguyên nhân rõ.
- Nếu không chắc, revert thay đổi trong prompt này.

PHASE 6 — RUNTIME SMOKE TEST NẾU CÓ RUNTIME CHANGE
Test tối thiểu:
- No-token / unauthorized case.
- Success case.
- Permission denied / cross-scope case nếu có.
- Regression feature quan trọng.
- Cleanup test data.

Không gọi external API thật nếu không cần.
Không dùng production DB.

PHASE 7 — UPDATE DOCS NHẸ
Chỉ cập nhật:
- [PROJECT_PROGRESS.md nếu có]
- [FEATURE_AUDIT_CHECKLIST.md nếu có]
- [REFACTOR_PLAN.md nếu có]
- [report ngắn]

Không docs-heavy.

PHASE 8 — COMMIT
Chỉ commit nếu validation PASS.
Không dùng git add .
Stage file cụ thể:
- [file 1]
- [file 2]

Kiểm tra:
- git diff --cached --name-only
- git diff --cached --check

Commit message:
- [message ngắn, rõ]

Không push remote.

FINAL RESPONSE:
Trả lời ngắn:
1. Đang ở phase nào.
2. Đã sửa gì.
3. File source đã sửa.
4. Validation PASS/FAIL.
5. Runtime smoke PASS/NOT REQUIRED/BLOCKED.
6. Source ngoài phạm vi có đổi không.
7. .env có bị stage/commit không.
8. Commit mới nếu có.
9. Report path nếu có.
10. Tiếp theo nên làm gì và mục tiêu gì.
```

---

## 5. Các chế độ prompt nên dùng

### 5.1. Read-only Audit Mode

Dùng khi mới nhận dự án hoặc chưa có Git checkpoint.

Quy tắc:

- Chỉ đọc/scan.
- Không sửa source.
- Không chạy app nếu có side effect.
- Không migration.
- Xuất report: cấu trúc, rủi ro, kế hoạch.

---

### 5.2. Safe Execution Mode

Dùng khi sửa code có rủi ro.

Quy tắc:

- Scope nhỏ.
- Validation trước/sau.
- Runtime smoke nếu đổi behavior.
- Commit riêng.

---

### 5.3. Lean Execution Mode

Dùng khi muốn tiết kiệm credit/token.

Quy tắc:

- Ưu tiên sửa source thật.
- Report ngắn.
- Không lặp lịch sử dài.
- Chỉ cập nhật docs cần thiết.
- Final response ghi tỷ lệ source/docs-report.

---

### 5.4. Runtime Smoke Mode

Dùng khi đã build pass nhưng chưa chạy thật.

Quy tắc:

- Không sửa code nếu không cần.
- Chuẩn bị env/test DB an toàn.
- Chạy API/flow thật có kiểm soát.
- Không đánh dấu runtime PASS nếu chưa gọi thật.

---

### 5.5. Migration/Database Mode

Dùng khi cần đổi schema/database.

Quy tắc:

- Bắt buộc có backup/rollback plan.
- Không dùng `db push --accept-data-loss`.
- Migration phải rõ additive/destructive.
- Nếu destructive: cần approval rõ.
- Test trên local/staging trước.

---

### 5.6. Project Structure Consolidation Mode

Dùng khi muốn sắp xếp lại thư mục/tệp.

Chỉ nên làm sau khi:

- Security chính đã ổn.
- Runtime baseline đã có.
- DevOps/migration risk đã được kiểm soát.
- Có route/module map.
- Có test/build guard.

Quy tắc:

- Không move file hàng loạt nếu import map chưa rõ.
- Không xóa code nếu chưa có dead-code audit.
- Mỗi prompt chỉ move một nhóm module.
- Sau mỗi move phải build/test.

---

## 6. Checklist trước khi gửi prompt cho AI coding agent

Trước khi gửi prompt, tự kiểm tra:

- [ ] Task có tên rõ chưa?
- [ ] Có ghi mục tiêu cụ thể chưa?
- [ ] Có ghi phạm vi được sửa và không được sửa chưa?
- [ ] Có ghi lệnh preflight Git chưa?
- [ ] Có cấm đọc/in `.env` thật chưa?
- [ ] Có cấm `git add .` chưa?
- [ ] Có cấm production DB/migration phá dữ liệu chưa?
- [ ] Có validation trước/sau chưa?
- [ ] Có runtime smoke nếu đổi runtime chưa?
- [ ] Có yêu cầu report ngắn/chống docs-heavy chưa?
- [ ] Có final response format chưa?
- [ ] Có next step rõ chưa?

---

## 7. Checklist đánh giá kết quả AI trả về

Sau khi AI chạy xong, kiểm tra:

- [ ] Có đúng branch không?
- [ ] Có commit vào main/master không?
- [ ] Có push remote không?
- [ ] Có stage/commit `.env` không?
- [ ] Có sửa ngoài phạm vi không?
- [ ] Có sửa schema/migration/package ngoài yêu cầu không?
- [ ] Static validation PASS không?
- [ ] Runtime smoke có chạy thật không?
- [ ] Có cleanup test data không?
- [ ] Có ghi rõ PASS/WARNINGS/BLOCKED không?
- [ ] Có report ngắn đủ hiểu không?
- [ ] Có next step hợp lý không?

---

## 8. Quy tắc đặt trạng thái

| Trạng thái | Khi nào dùng |
|---|---|
| PASS | Validation và smoke cần thiết đều pass. |
| PASS WITH WARNINGS | Task chính xong, còn warning không chặn tiếp. |
| NEEDS FIX | Phát hiện bug/rủi ro cần prompt fix tiếp. |
| BLOCKED | Thiếu Git/env/DB/context/quyền, không được làm tiếp. |
| NOT REQUIRED | Một bước không cần chạy vì không liên quan, phải ghi lý do. |
| NOT VERIFIED | Chưa kiểm chứng runtime, không được gọi là xong thật. |

---

## 9. Quy tắc tổ chức code chung

Áp dụng cho backend/frontend tùy stack:

### Backend

Nên tách dần:

```text
src/
  domain/             # nghiệp vụ lõi, không phụ thuộc framework/db/sdk
  application/        # use cases, contracts/interfaces
  infrastructure/     # db/repository/gateway/config/external integrations
  presentation/       # routes/controllers/middleware/http mapping
```

Dependency rule:

```text
presentation -> application -> domain
infrastructure -> application/domain contracts
```

Không nên:

- Business logic nằm hết trong route file lớn.
- Controller gọi raw SQL khắp nơi.
- Tạo nhiều PrismaClient/DB client.
- Import Express/Prisma vào domain.

---

### Frontend

Nên tách:

```text
src/
  app/                # route/page/layout
  features/           # feature-specific UI + hooks + logic
  components/         # shared UI
  lib/                # api client, config, auth, utils
  styles/             # global styles/tokens
```

Không nên:

- Page chứa quá nhiều state/form/API/UI cùng lúc.
- API URL hard-code trong component.
- Secret trong public env.
- Component mock bị ghi là nghiệp vụ thật.

---

## 10. Quy tắc bảo mật ứng dụng

Bắt buộc kiểm tra khi có auth/data/API:

- [ ] Auth middleware có trên route cần bảo vệ.
- [ ] RBAC/role guard đúng vai trò.
- [ ] Tenant/user scope nằm trong query, không chỉ kiểm tra ở UI.
- [ ] Cross-tenant/cross-user trả 404 hoặc 403 theo policy.
- [ ] Input được validate.
- [ ] Không SQL injection/raw query unsafe.
- [ ] Không log secret/token.
- [ ] Không expose field nhạy cảm ra frontend.
- [ ] File upload có kiểm tra type/size.
- [ ] External API call không chạy trong smoke test nếu không mock.

---

## 11. Quy tắc DevOps/deploy

Trước khi deploy hoặc sửa DevOps:

- [ ] Có `.gitignore` đúng.
- [ ] Có `.env.example` không chứa secret.
- [ ] Có health check.
- [ ] Có build command rõ.
- [ ] Có rollback/backup plan.
- [ ] Không deploy thẳng production nếu chưa test staging/local.
- [ ] Không chạy migration phá dữ liệu không backup.
- [ ] Không dùng script local nguy hiểm cho production.
- [ ] Không deploy vào thời điểm rủi ro nếu không có người trực.

---

## 12. Mẫu final response chuẩn

```txt
Hoàn tất [Prompt/Tên task].

1. Trạng thái: PASS / PASS WITH WARNINGS / NEEDS FIX / BLOCKED.
2. Đã sửa: [tóm tắt ngắn].
3. File source sửa: [danh sách].
4. File docs/report sửa: [danh sách].
5. Validation: [lệnh + kết quả].
6. Runtime smoke: PASS / NOT REQUIRED / BLOCKED + lý do.
7. Không thay đổi: [schema/env/RAG/webhook/package/etc].
8. Secret/env: không stage/commit.
9. Commit: [hash/message] hoặc chưa commit vì [lý do].
10. Report: [path].
11. Tiếp theo: [Prompt tiếp theo] — mục tiêu [mục tiêu].
```

---

## 13. Prompt siêu ngắn dùng nhanh

Dùng khi task nhỏ:

```txt
Bạn là Senior Software Engineer. Hãy xử lý task sau trong phạm vi nhỏ và an toàn.

Task: [mô tả task]

Quy tắc:
- Kiểm tra git status trước.
- Không dùng git add .
- Không mở/in .env thật.
- Không sửa ngoài phạm vi.
- Không sửa schema/migration/package/deploy nếu không được yêu cầu.
- Chạy validation trước/sau.
- Nếu đổi runtime, chạy smoke test local/test.
- Nếu thiếu context hoặc rủi ro production, dừng và báo BLOCKED.
- Report ngắn, không docs-heavy.

Phạm vi được sửa:
- [files/folders]

Không được sửa:
- [files/folders]

Final response gồm: trạng thái, file sửa, validation, runtime smoke, env safety, commit, next step.
```

---

## 14. Prompt tạo kế hoạch trước khi code

```txt
Bạn là Senior Project Architect.

Hãy audit read-only dự án và lập kế hoạch refactor/triển khai.

Không sửa source.
Không chạy migration.
Không mở .env thật.
Không commit.

Cần xuất:
1. Tổng quan kiến trúc hiện tại.
2. Danh sách module/chức năng.
3. Rủi ro P0/P1/P2.
4. Kế hoạch phase nhỏ.
5. Validation cần có cho từng phase.
6. Prompt tiếp theo nên làm gì và đạt mục tiêu gì.
```

---

## 15. Ghi nhớ quan trọng

AI có thể viết code nhanh, nhưng người dùng vẫn phải kiểm soát:

- Kiến trúc tổng thể.
- Bảo mật.
- Dữ liệu thật.
- Production.
- Scope từng prompt.
- Validation thật.
- Git và rollback.

Câu cần nhớ:

> Code chạy được chưa đủ. Code phải an toàn, kiểm chứng được, dễ rollback, dễ bảo trì và không phá dữ liệu thật.
