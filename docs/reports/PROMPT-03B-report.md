# Báo cáo PROMPT 03B — Tách cổng Admin/User · Nâng cấp shell · Kế hoạch Auth/OCR/DOCX

- **Ngày:** 2026-07-04
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `docs/reports/PROMPT-03A-report.md`
- **Phạm vi:** tách route Admin/User, nâng cấp UI shell, cập nhật docs. **Không**
  làm auth/DB/OCR/DOCX/CRUD thật.

---

## A — Hiện trạng trước khi sửa

Route cũ (Prompt 03A): `/` (danh sách link cơ bản), `/login` (nhóm `(auth)`),
`/admin`, `/secretary`, `/parent`, `/gioi-thieu`, `/api/health`. Chưa có auth thật,
chưa schema/RLS, chưa OCR/DOCX/CRUD.

---

## B — Cấu trúc route MỚI (tách cổng)

| Cổng | Đăng nhập | Sau đăng nhập |
| --- | --- | --- |
| **Admin** | `/admin/login` | `/admin` |
| **Người dùng** | `/user/login` | `/user/secretary` · `/user/parent` |

- **Trang chủ `/`**: entry page gọn — giới thiệu hệ thống + 2 nút
  **"Vào cổng Người dùng"** và **"Vào cổng Admin"** (không còn danh sách link cơ bản).
- Bí thư & Phụ huynh/Học sinh nằm trong cổng **Người dùng**; sau khi bật auth thật,
  đăng nhập sẽ redirect theo vai trò qua `ROLE_HOME`
  (`SECRETARY → /user/secretary`, `PARENT → /user/parent`).
- Dùng **route group** để tách chrome: `admin/(auth)` (trang login) vs
  `admin/(portal)` (dashboard có `DashboardShell`). Cổng User: `user/(auth)` +
  `user/secretary` + `user/parent`.

### Route cũ → redirect (không xóa cứng liên kết)

Cấu hình trong `next.config.ts` (307 tạm thời), đã kiểm thử runtime:

| Cũ | Mới |
| --- | --- |
| `/login` | `/user/login` |
| `/secretary` · `/secretary/:path*` | `/user/secretary` · `/user/secretary/:path*` |
| `/parent` · `/parent/:path*` | `/user/parent` · `/user/parent/:path*` |

---

## C — Nâng cấp UI shell (mobile-first, không làm design system phức tạp)

- **`AuthShell`** (mới): khung trang đăng nhập dùng chung, brand gọn, nhãn cổng, lối
  "Về trang chủ". Dùng cho cả `/admin/login` và `/user/login`.
- **`DashboardShell`** (nâng cấp): thêm **top bar dính** (thương hiệu + nhãn vai trò +
  "Đăng xuất" trỏ đúng cổng theo vai trò), bố cục sidebar mobile-first.
- **`SidebarNav`** (mới, client): điều hướng có **active-state** theo `usePathname`.
- **`LoginForm`** (mới): form đăng nhập dạng shell (field disabled — chưa gọi auth),
  tái sử dụng cho 2 cổng.
- Landing `/` và `/gioi-thieu` cập nhật CTA theo cổng mới. Bảng màu giữ nguyên
  (nền sáng, ink), thêm accent indigo cho trạng thái tương tác.

### File mới / thay đổi chính

```
src/app/page.tsx                         (rewrite — landing 2 cổng)
src/app/admin/(auth)/layout.tsx          (mới)
src/app/admin/(auth)/login/page.tsx      (mới)
src/app/admin/(portal)/layout.tsx        (mới — thay admin/layout.tsx)
src/app/admin/(portal)/page.tsx          (mới — thay admin/page.tsx)
src/app/user/(auth)/layout.tsx           (mới)
src/app/user/(auth)/login/page.tsx       (mới)
src/app/user/secretary/{layout,page}.tsx (mới — thay /secretary)
src/app/user/parent/{layout,page}.tsx    (mới — thay /parent)
src/components/layout/AuthShell.tsx       (mới)
src/components/layout/SidebarNav.tsx      (mới)
src/components/layout/DashboardShell.tsx  (nâng cấp)
src/components/layout/nav-config.ts       (href /user/*, thêm ROLE_LOGIN_HREF)
src/components/forms/LoginForm.tsx        (mới)
next.config.ts                            (redirects)
src/lib/auth/rbac.ts                      (PROTECTED_PREFIXES + PUBLIC_PATHS)
src/modules/auth/domain/roles.ts          (ROLE_HOME)
src/app/(public)/gioi-thieu/page.tsx      (CTA)
```

**Đã xóa** (đã có route mới + redirect thay thế): `src/app/(auth)/`,
`src/app/secretary/`, `src/app/parent/`, `src/app/admin/layout.tsx`,
`src/app/admin/page.tsx`.

---

## D — RBAC / route guard (chuẩn bị, chưa bật)

- `PROTECTED_PREFIXES`: `/admin`, `/user/secretary`, `/user/parent`.
- **`PUBLIC_PATHS`** (mới): `/admin/login`, `/user/login` — loại trừ trước khi xét
  prefix để guard tương lai **không chặn nhầm** trang đăng nhập nằm trong `/admin`.
- `proxy.ts` vẫn chỉ refresh phiên (guard redirect để Phase 2). Chặn cuối vẫn là RLS.

---

## E — Docs cập nhật

- `docs/auth-strategy.md` (mới): tách cổng, redirect theo vai trò, chiến lược tài khoản
  (Admin không tự đăng ký; phụ huynh: email/SĐT/mã — chưa chốt).
- `docs/ocr-import.md` (mới): import giấy tờ **staging-first + duyệt tay**, OCR tùy chọn
  server-side, module `imports`.
- `docs/docx-export.md` (mới): export DOCX theo template Admin quản lý, render server-side,
  chặn `.docm`/macro, module `exports`.
- `docs/README.md`, `docs/roadmap.md`: cập nhật index + mục Phase 03B.

---

## F — Kiểm tra chất lượng

| Bước | Kết quả |
| --- | --- |
| `npm run lint` | ✅ Pass |
| `npm run typecheck` | ✅ Pass (sau khi xóa `.next` cũ để tái sinh route types) |
| `npm run build` | ✅ Pass — 8 route + Proxy middleware |
| Dev runtime | ✅ Toàn bộ route mới HTTP 200; `/api/health` ok |
| Redirect cũ→mới | ✅ 307 tới đúng đích (`/login`, `/secretary(/*)`, `/parent(/*)`) |

> Lưu ý: lần typecheck đầu báo lỗi do `.next/types` cũ còn tham chiếu route cũ —
> đã `rm -rf .next` + build lại, typecheck sạch. Trong quá trình test có một dev
> server cũ chiếm cổng 3000 gây 500 giả; đã dọn tiến trình và test lại toàn bộ 200.

---

## G — Tuân thủ quy tắc

- ✅ Không xóa docs/report cũ (03A giữ nguyên; thêm 03B).
- ✅ Đổi route có **redirect** thay thế + ghi rõ trong report.
- ✅ Không commit secret; `SUPABASE_SERVICE_ROLE_KEY` không vào client component.
- ✅ Không thêm package (dùng Tailwind + helper `cn` sẵn có).
- ✅ Không OCR/migration/auth/DOCX/CRUD thật. Không tắt lint/build.

## Chưa làm (đúng phạm vi 03B)

Auth thật · guard redirect thật · DB schema/RLS · OCR thật · DOCX render thật · CRUD.
