# UI/UX Polish + No-Regression Notes — Prompt 10D

> Bản ghi thay đổi UI của 10D và cam kết KHÔNG regression nghiệp vụ.

## Cam kết không regression
- ❌ **Không** đổi route/trang (không thêm/xóa/đổi path).
- ❌ **Không** đổi schema DB / migration / RLS.
- ❌ **Không** đổi Auth/RBAC/guard, logic AI import, DOCX engine, notification.
- ❌ **Không** public bucket; không thêm avatar/parent request-edit/realtime.
- ✅ Chỉ đổi **lớp trình bày**: component UI dùng chung, class Tailwind, màu primary,
  focus ring, trạng thái rỗng/thông báo, spacing bảng.

## Design system light (mới `src/components/ui/`)
| Component | Vai trò |
|---|---|
| `SectionCard` | Thẻ mục có header (tiêu đề + mô tả + hành động góc phải) |
| `EmptyState` | Trạng thái rỗng chuẩn (icon + tiêu đề + mô tả + action) |
| `StatusBadge` | Ánh xạ trạng thái nghiệp vụ → tone màu + nhãn VN nhất quán |
| `InlineAlert` | Thông báo trong-trang success/error/warning/info (role a11y) |
| `ActionBar` | Thanh filter/hành động trên đầu bảng (trái filter · phải action) |
| `DataTableShell` | Khung bảng bo góc + cuộn ngang mobile (lớp `.dt` ở globals) |
| `SkeletonBlock` | Khối "đang tải" cho loading/Suspense |
| `FormField` + `fieldClass` | Bọc trường form (label/hint/error) + class input dùng chung |

## Nâng cấp component sẵn có
- `Button`: primary đổi `slate-800 → indigo-600` (đồng bộ thương hiệu), thêm biến thể
  `danger` + kích thước `sm/md` + `focus-visible` ring. Backward-compatible (props cũ giữ nguyên).
- `PageHeader` (layout): thêm slot `eyebrow` + `actions` (tùy chọn) — trang cũ không truyền vẫn chạy.
- `ui/index.ts`: export thêm các component mới.

## Global visual language (`globals.css`)
- `:focus-visible` viền indigo rõ (chỉ khi điều hướng bàn phím — không phá click chuột).
- `::selection` màu indigo-100.
- Lớp `.dt` chuẩn hóa spacing bảng (header slate-50, cell thoáng, viền dòng mảnh, hover).
- Font smoothing HiDPI.

## Trang đã polish trực tiếp
- `components/forms/LoginForm.tsx` → `FormField` + `fieldClass` + `InlineAlert` (dùng cho cả `/user/login` và `/admin/login`).
- `admin/(portal)/students/page.tsx` → `EmptyState` + `StatusBadge` (giữ nguyên filter/pagination/logic).
- `user/secretary/page.tsx` → `EmptyState` cho "buổi hôm nay / sắp tới".
- `user/parent/page.tsx` → `InlineAlert` (cảnh báo chưa liên kết) + `EmptyState`.

## Trang chỉ chỉnh nhẹ (hưởng lợi tự động, không sửa từng dòng)
Mọi trang dùng `Button`, `PageHeader`, input tiêu chuẩn và table → tự đồng bộ màu primary,
focus ring, spacing nhờ nâng cấp ở tầng design system + `globals.css`.

## Để 10E / 10F
- Áp `SectionCard`/`DataTableShell`/`ActionBar` cho toàn bộ trang bảng còn lại (dần dần).
- Avatar private storage, Parent request-edit, realtime notification (10E).
- Load test + monitoring nâng cao (10F).
- Admin edit học sinh (hiện read-only).

## Kiểm thử
- `preflight` / `lint` / `typecheck` / `build` / `healthcheck` / `smoke:portal-separation`.
- Runtime smoke: public/user không có link Admin; `/admin/login` 200; guard redirect; health phase `10d-ui-ux-polish`.
