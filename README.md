# Điểm danh sinh hoạt hè — Web App

Web-app **mobile-first** điểm danh sinh hoạt hè: quản lý học sinh theo **Khu phố**, lập buổi sinh
hoạt, điểm danh, xin phép nghỉ, thông báo và xuất báo cáo DOCX.

> **Trạng thái (tới Prompt 09H):** đã có **nghiệp vụ thật** — Supabase Auth + RBAC + RLS deny-by-default,
> CRUD học sinh/Khu phố/tài khoản, workflow điểm danh + đơn nghỉ, AI import ảnh (Gemini, staging bắt buộc,
> ảnh gốc private + audit), export DOCX server-side, quên mật khẩu → Admin cấp lại, và thông báo
> (hủy/dời buổi tự gửi + Admin gửi hệ thống/Khu phố + unread/mark-read). Deploy trên Vercel.
> Chi tiết tiến độ: [`docs/PROJECT_PROGRESS.md`](./docs/PROJECT_PROGRESS.md).

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres/Auth/Storage) ·
Zod · Deploy: Vercel.

## Bắt đầu
```bash
npm install
cp .env.example .env.local   # điền giá trị Supabase (xem docs/security.md)
npm run dev                  # http://localhost:3000
```

## Biến môi trường production (bắt buộc)
| Biến | Nơi dùng | Ghi chú |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | công khai |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server | công khai (publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** | **BẮT BUỘC trên Vercel** cho route Storage private (xem/tải ảnh AI, tải mẫu DOCX). Thiếu → các route đó trả **503 thân thiện**. TUYỆT ĐỐI không expose ra client. |
| `GEMINI_API_KEY` | server-only | bật AI import; thiếu → nhập tay vẫn chạy |

Chi tiết + checklist: [`docs/production-env-checklist.md`](./docs/production-env-checklist.md).

## Scripts
| Lệnh | Việc |
| --- | --- |
| `npm run dev` / `build` / `lint` / `typecheck` | Dev / build / ESLint / `tsc --noEmit` |
| `npm run preflight` | Quét secret/ignored/mock + health phase trước deploy |
| `npm run smoke:admin-login` | E2E đăng nhập Admin (JWT thật, tài khoản disposable) |
| `npm run smoke:password-request` | E2E quên mật khẩu → Admin resolve |
| `npm run smoke:ai-image-http` | E2E route ảnh qua HTTP + cookie thật (cần `E2E_BASE_URL`) |
| `npm run assign:secretaries` | Xem/gán Khu phố cho Bí thư (dry-run mặc định) |
| `npm run recover:admin` | Break-glass đặt lại mật khẩu Admin (qua env) |
| `npm run cleanup:ai-import-images` | Retention ảnh AI (dry-run mặc định, `--apply` mới xóa) |
| `npm run healthcheck` | Kiểm `/api/health` production |

## Cấu trúc (thực tế)
- `src/app` — App Router (presentation + Server Actions + route handlers).
- `src/components` — UI/layout dùng chung.
- `src/lib` — **nơi chứa business logic + data-access thật** hiện tại: `src/lib/data/*`
  (đọc/ghi qua RLS), `src/lib/supabase`, `src/lib/auth`, `src/lib/storage`, `src/lib/monitoring`, `src/lib/env`.
- `src/modules/*` — hiện chủ yếu là **domain/skeleton** (enum roles/scope…); tầng application/infrastructure
  chưa bắt buộc. **Feature mới: giữ data-access ở `src/lib/data` cho tới khi refactor module có test bao phủ.**
- `src/proxy.ts` — route guard (Next 16 đổi tên từ `middleware.ts`).

Chuẩn tổ chức: [`docs/folder-architecture-standard.md`](./docs/folder-architecture-standard.md).

## CI / Automation
- `.github/workflows/ci.yml` — lint · typecheck · build (mọi push/PR).
- `.github/workflows/e2e-smoke.yml` — smoke E2E thật (dispatch + lịch), cần Repository Secrets.
- `.github/workflows/ai-import-retention.yml` — retention ảnh AI (dry-run; apply khi bật `AI_IMPORT_RETENTION_APPLY`).
- `.github/workflows/healthcheck.yml` — uptime check production.

## Tài liệu
Xem [`docs/`](./docs/) — kiến trúc, mô hình dữ liệu, bảo mật, AI import, DOCX, thông báo
([`notification-system.md`](./docs/notification-system.md)), vận hành, và **reports** theo từng prompt.
