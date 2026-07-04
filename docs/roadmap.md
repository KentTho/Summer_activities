# Lộ trình triển khai

| Phase | Mục tiêu | Trạng thái |
| --- | --- | --- |
| Phase 0 | Chốt docs, nghiệp vụ, data model, phân quyền | ✅ (spec gốc) |
| **Phase 1** | **Scaffold Next.js, Supabase config, auth shell, layout role-based** | ✅ **(bản này)** |
| Phase 2 | Schema DB, migration, seed tối thiểu, RLS | ⬜ |
| Phase 3 | CRUD Khu phố, Bí thư, học sinh, phụ huynh | ⬜ |
| Phase 4 | Attendance session, leave request, thống kê cơ bản | ⬜ |
| Phase 5 | Thông báo in-app theo phạm vi | ⬜ |
| Phase 6 | Import giấy tờ, staging, OCR tùy chọn | ⬜ |
| Phase 7 | DOCX export + quản lý template an toàn | ⬜ |
| Phase 8 | CI/CD, test cơ bản, security hardening | ⬜ (CI khung đã có) |

## Phase 1 — đã hoàn thành (scaffold)
- Next.js 16 App Router + TypeScript + Tailwind v4 + ESLint.
- Cấu trúc Clean Architecture: `app/`, `components/`, `modules/*`, `lib/*`.
- `proxy.ts` (route guard skeleton) + helper refresh phiên Supabase.
- Layout + dashboard shell cho 3 vai trò; login shell; trang công khai.
- Supabase config mẫu (`supabase/`), `.env.example`, CI (`.github/workflows/ci.yml`).
- Domain enum chính (role, attendance, session type, leave, notification scope).

## Phase 03B — nâng cấp shell & tách cổng (đã hoàn thành)
- Tách cổng đăng nhập: **Admin** (`/admin/login` → `/admin`) và **Người dùng**
  (`/user/login` → `/user/secretary` \| `/user/parent`).
- Trang chủ `/` thành entry page với 2 nút cổng; route cũ redirect (`next.config.ts`).
- Nâng cấp shell UI: top bar dính, nav active-state, `AuthShell` dùng chung.
- Docs mới: `auth-strategy.md`, `ocr-import.md`, `docx-export.md`.

## Ranh giới Phase 1/03B (CHƯA làm — có chủ đích)
OCR · DOCX export thật · notification thật · CRUD thật · migration/RLS · auth thật.
Tất cả để lại TODO tại module/lib tương ứng.

## Bước tiếp theo (Phase 2)
1. Quyết định chiến lược đăng nhập phụ huynh (email / SĐT / mã tài khoản) — Open question spec §10.
2. Viết migration tạo bảng theo `data-model.md` + bật RLS với helper function.
3. Sinh type: `supabase gen types typescript` → thay `Database` trong `lib/types`.
4. Nối auth thật vào `lib/auth/session.ts` và bật guard trong `proxy.ts`.
