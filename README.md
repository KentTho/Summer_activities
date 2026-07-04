# Điểm danh sinh hoạt hè — Web App

Web-app **mobile-first** điểm danh sinh hoạt hè: quản lý học sinh theo **Khu phố**, lập buổi sinh
hoạt, điểm danh, xin phép nghỉ, thông báo và xuất báo cáo. Xây theo **Clean Architecture**.

> **Trạng thái: Phase 1 — Scaffold.** Đã dựng nền tảng; chưa có nghiệp vụ thật (CRUD, OCR, DOCX,
> notification, migration/RLS). Xem [`docs/roadmap.md`](./docs/roadmap.md).

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres/Auth/Storage, target) ·
Zod · Deploy: Vercel.

## Bắt đầu
```bash
npm install
cp .env.example .env.local   # điền giá trị Supabase (xem docs/security.md)
npm run dev                  # http://localhost:3000
```
App chạy được **không cần** Supabase env (các adapter tự pass-through ở Phase 1).

## Scripts
| Lệnh | Việc |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Cấu trúc
`src/app` (presentation) · `src/components` (ui/layout/forms) · `src/modules/*`
(domain/application/infrastructure theo bounded context) · `src/lib/*` (supabase, auth, validation,
security, utils, types) · `src/proxy.ts` (route guard — Next 16 đổi tên từ `middleware.ts`).
Chi tiết: [`docs/architecture.md`](./docs/architecture.md).

## Tài liệu
Xem thư mục [`docs/`](./docs/) — overview, kiến trúc, mô hình dữ liệu, bảo mật, roadmap và **spec gốc**
(`docs/spec/`).

## Route (Phase 1 shell)
`/` landing · `/gioi-thieu` công khai · `/login` cổng đăng nhập · `/admin` · `/secretary` · `/parent`
· `/api/health` health check.
