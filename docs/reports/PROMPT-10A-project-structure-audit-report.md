# Báo cáo PROMPT 10A — Rà soát cấu trúc dự án + Chuẩn hóa Folder Architecture Docs

- **Ngày:** 2026-07-08
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-09C-ai-import-hardening-rate-limit-storage-report.md`
- **Loại:** REVIEW + DOCUMENTATION (KHÔNG sửa code nghiệp vụ)

## 1. Mục tiêu
Rà soát toàn bộ cấu trúc thư mục/tệp, đánh giá mức độ sẵn sàng triển khai thực tế (market-ready),
chỉ ra điểm mạnh/rủi ro/cần cải thiện, và xuất tài liệu chuẩn folder architecture cho team. Không sửa
code app, không migration, không deploy.

## 2. Phạm vi
- **Có làm:** đọc cây thư mục + config + docs; đánh giá; tạo 3 tài liệu docs + 1 report; cập nhật
  progress/history.
- **KHÔNG làm:** sửa `src/app`/`src/lib`/`src/modules`/`supabase/migrations`; chạy migration; đụng
  `.env.local`/secret/Vercel/Supabase remote; xóa/di chuyển file; đổi import; refactor; deploy.

## 3. File đã đọc (chỉ đọc)
`git status`/`git log`; `package.json`, `next.config.ts`, `vercel.json`, `tsconfig.json`,
`.github/workflows/ci.yml`, `.env.example`; `README.md`; `docs/PROJECT_PROGRESS.md`,
`docs/IMPLEMENTATION_HISTORY.md`, `docs/architecture.md`, `docs/engineering-guardrails.md`,
`docs/project-repair-backlog.md`, `docs/reports/PROMPT-09C-...`; cây `src/**`, `supabase/**`,
`docs/**`, `.github/**`, `scripts/**`; mẫu nội dung `src/modules/*/*` (xác nhận placeholder).

## 4. Cấu trúc hiện tại (tóm tắt)
- `src/app` — App Router, tách cổng bằng **route groups**: `admin/(auth|portal)`, `user/(auth)` +
  `user/{secretary,parent}`, `change-password`, `api/health`. Server Actions (`actions.ts`) + form
  client (`*Form.tsx`) co-located cạnh `page.tsx`. Có dynamic route `sessions/[sessionId]`.
- `src/components` — `ui/`, `layout/`, `forms/` + barrel `index.ts`.
- `src/lib` — **nơi chứa business logic + data-access THẬT**: `supabase/`, `auth/`, `data/` (11 file
  theo domain), `admin/`, `ai-import/`, `docx/`, `reports/`, `storage/`, `monitoring/`, `security/`,
  `validation/`, `types/`, `utils/`, `env.ts`, `database.types.ts`.
- `src/modules` — skeleton `domain/application/infrastructure` cho 10 bounded context, nhưng
  `application/` + `infrastructure/` **gần như rỗng** (`export {}`); chỉ vài file `domain/*` (enum
  trạng thái, role…) là code thật và được import.
- `supabase` — 13 migration additive, `tests/rls_smoke.sql`, `seed.sql`, `config.toml`, README.
- `docs` — ~40 file: progress, history, reports/prompt, playbook vận hành, architecture, security.
- `.github` — 1 workflow CI (lint · typecheck · build). `scripts` — preflight + bootstrap.
- Config gốc sạch: `.env.example` chỉ placeholder; `tsconfig` alias `@/* → src/*`; `vercel.json`
  khai báo framework nextjs.

Chi tiết đầy đủ: `docs/project-structure-audit.md` mục 1.

## 5. Đánh giá market-ready
**Kết luận: ĐỦ nền để triển khai thực tế quy mô pilot/nhỏ. Không cần refactor lớn ngay.**
Chấm theo 10 tiêu chí (chi tiết bảng ở audit mục 2):
- 🟢 Tốt/production-grade: tách trách nhiệm, không trộn client/server, không lộ secret, RLS/Auth,
  docs vận hành, deploy/rollback.
- 🟡 Khá/MVP: dễ hiểu cho dev mới (bị docs lệch làm giảm), mở rộng tính năng, khả năng test (CI chưa
  có job test), rủi ro khi scale team (cần chốt kiến trúc module).

## 6. Điểm mạnh
1. Tách cổng rõ bằng route groups (vai trò hiện trên cây thư mục).
2. Data-access layer thật `src/lib/data/*` (gom truy vấn, tránh N+1).
3. Server Actions + form client co-located đúng chuẩn App Router.
4. Bảo mật hàng đầu: service role server-only, RLS deny-by-default, Zod server, audit, storage private,
   rate-limit AI atomic ở DB.
5. Vệ sinh secret + `scripts/preflight-check.mjs` quét trước commit.
6. Zero-dependency có chủ đích cho DOCX/ZIP.
7. Tài liệu vận hành rất đầy đủ + report từng prompt (truy vết tốt).
8. CI/CD + migration additive/idempotent + health feature flags.

## 7. Điểm rủi ro (không sửa trong 10A — chỉ ghi nhận)
- **CAO:** `src/modules/*` phần lớn placeholder `export {}` trong khi logic thật ở `src/lib/`;
  `architecture.md` mô tả sai → nợ kiến trúc + dev mới tìm nhầm chỗ.
- **CAO:** `README.md` ghi sai trạng thái ("Phase 1 — Scaffold"; thực tế tới 09C).
- **TRUNG BÌNH:** sơ đồ route trong `architecture.md` lệch cây thật; CI chưa có test tự động (RLS
  smoke chạy tay); chưa có `src/types`/`src/config` tập trung.
- **THẤP:** `DemoNotice` export nhưng không dùng; casing app chưa ghi quy ước; Postgres local 15 vs remote 17.

Bảng đầy đủ (mức độ · vấn đề · vị trí · tác động · đề xuất): `docs/project-structure-audit.md` mục 5.

## 8. Tài liệu đã tạo
1. `docs/project-structure-audit.md` — tổng quan cấu trúc, đánh giá market-ready (10 tiêu chí), điểm
   mạnh/yếu, bảng rủi ro, kết luận triển khai.
2. `docs/folder-architecture-standard.md` — chuẩn tổ chức thư mục Next.js + Supabase + Vercel; quy tắc
   client/server, data-access, module/domain, đặt tên, docs/reports; checklist thêm feature mới.
3. `docs/project-structure-refactor-backlog.md` — việc cải thiện sau, chia 5 phase + "không nên làm ngay".
4. `docs/reports/PROMPT-10A-project-structure-audit-report.md` — báo cáo này.

## 9. Code có bị thay đổi không?
**KHÔNG.** Chỉ tạo mới 4 file trong `docs/` + cập nhật `PROJECT_PROGRESS.md`/`IMPLEMENTATION_HISTORY.md`.
Không đụng `src/`, `supabase/`, config, secret, remote, deploy. `git status` chỉ hiện thay đổi trong `docs/`.

## 10. Gợi ý bước tiếp theo
1. **Prompt sửa docs (Phase 1 backlog)** — rẻ & an toàn nhất: cập nhật `README.md` + vẽ lại sơ đồ
   `architecture.md` theo thực tế. Nên làm ngay vì giá trị onboarding cao, rủi ro ~0.
2. **Thêm job test vào CI (Phase 4)** — đưa RLS smoke vào CI trước khi mở rộng team.
3. **Chốt quyết định `src/modules/` (Phase 2)** — refactor có test bao phủ, làm từng bước.

## 11. Các điểm dự án cần tu sửa thêm
- Đồng bộ tài liệu ↔ code (README/architecture) là ưu tiên số 1 (đang gây hiểu nhầm độ chín sản phẩm).
- Ra 1 quyết định kiến trúc cho `src/modules/` để hết trùng lặp ý đồ với `src/lib/`.
- Bổ sung kiểm thử tự động (RLS/nghiệp vụ) vào CI.
- Chuẩn hóa dần nơi đặt type/config; dọn `DemoNotice`.

## 12. Những việc không nên làm ngay (tránh lan man)
- Không refactor toàn bộ sang `src/features/` trong một lần (đụng hàng loạt import — làm dần, có test).
- Không đổi path alias `@/*` hay di chuyển `src/lib/data/*` khi chưa có test bao phủ.
- Không thêm framework kiến trúc nặng (DI/nest-style) cho quy mô hiện tại.
- Không đổi tên/di chuyển migration đã áp remote.
- Không sửa các vấn đề nêu trên trong prompt này — đúng phạm vi 10A là review + docs.
</content>
