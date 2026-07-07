# Production Readiness Playbook — Điểm danh sinh hoạt hè

> Tạo ở **Prompt 09A**. Checklist áp dụng thực tế cho dự án này (không phải lý thuyết).
> Tổng hợp 4 nhóm: DevOps · Auth/Session · SDLC/Test · AI-Security. Chi tiết ở các file kèm.

## 0. Trước mỗi lần deploy (bắt buộc)
- [ ] `npm run preflight` xanh (không commit secret/ignored, không rò rỉ key, health phase đúng).
- [ ] `npm run lint` · `npm run typecheck` · `npm run build` đều xanh.
- [ ] Smoke test bằng **client đăng nhập thật** (không service role) cho phần vừa đổi.
- [ ] Migration (nếu có) là **additive/idempotent**; đã `migration list` khớp local↔remote.
- [ ] KHÔNG deploy chiều thứ Sáu / cuối ngày trừ hotfix có đường lùi rõ.

## 1. Cấu hình môi trường production (Vercel)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (public — OK để lộ client).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (server-only — KHÔNG `NEXT_PUBLIC_`). Cần cho: tạo/reset tài khoản,
      Storage mẫu DOCX, đọc mẫu để merge.
- [ ] `OCR_SPACE_API_KEY` + `OCR_PROVIDER=ocrspace` (server-only). Thiếu → OCR tắt, nhập tay vẫn chạy.
      Xem `ocr-production-setup.md`.
- [ ] KHÔNG đưa service role / OCR key / DB password vào client hay git.

## 2. Bảo mật (xem `auth-session-hardening.md`, `ai-code-security-gate.md`)
- [ ] RLS bật deny-by-default trên mọi bảng; không `using(true)` ở bảng dữ liệu cá nhân.
- [ ] Bucket `report-templates` **private** (không public URL); chỉ đọc qua route server.
- [ ] Ép đổi mật khẩu lần đầu (`must_change_password`) đang bật.
- [ ] Validate input bằng Zod ở server; whitelist field; không log PII/secret.

## 3. Sức khỏe & giám sát
- [ ] `/api/health` trả phase hiện tại + cờ `supabaseConfigured/ocrConfigured/docxExportReady/passwordChangeReady`.
- [ ] Sau deploy: `curl /api/health` + `curl -I /`, `/admin/login`, `/user/login` = 200/redirect hợp lệ.
- [ ] Log lỗi server (không PII). Monitoring nâng cao → backlog (`project-repair-backlog.md`).

## 4. Đường lùi (rollback)
- [ ] Vercel: instant rollback về deployment trước (immutable). Không cần rebuild.
- [ ] DB: migration additive nên hiếm khi cần lùi; nếu buộc, viết migration bù (không `db reset`).
- [ ] Ghi lại deployment id + thời điểm khi release quan trọng.

## 5. Định nghĩa "Done" cho mỗi tính năng (xem `sdlc-debugging-test-plan.md`)
- [ ] Có acceptance criteria + luật quyền (ai làm gì) trước khi code.
- [ ] Có test hành vi thật; có report ghi việc đã làm + sự cố/gốc rễ.
- [ ] Cập nhật `PROJECT_PROGRESS.md` + `IMPLEMENTATION_HISTORY.md`.
