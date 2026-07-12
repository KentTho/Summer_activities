# PROMPT 10D — UI/UX Polish Admin/User (không đổi nghiệp vụ)

**Trạng thái tổng:** ✅ Hoàn tất. Design system light + polish 3 cổng. Không đổi route/DB/RLS/Auth/logic.
Validation xanh; deploy production phase `10d-ui-ux-polish`; portal smoke 9/9; endpoints 200.

---

## 1. Mục tiêu
Chuẩn hóa design system nhẹ và nâng trải nghiệm 3 cổng (Admin, Bí thư/Chi Đoàn, Phụ huynh/Học sinh)
mà **không** đổi nghiệp vụ, route, Auth/RBAC/RLS, schema, logic AI/DOCX/notification.

## 2. Hiện trạng trước
- `Button` primary `slate-800` lệch với `bg-indigo-600` inline nhiều nơi → hai "primary".
- Class input lặp lại từng trang; trạng thái rỗng/thông báo lỗi rời rạc.
- Focus ring không đồng bộ; thiếu component dùng chung (header có action, thẻ có tiêu đề+action, bảng cuộn).
- Health phase `10c-portal-separation-student-fields`.

## 3. UI inventory audit
`docs/ui-ux-audit-10D.md` — bảng từng trang (Admin 14 · Bí thư 9 · Phụ huynh 6 · Public/Auth 6):
cột Vấn đề · Mức độ · Cách xử lý 10D · Không xử lý (để 10E/10F). Không sửa ngoài danh sách.

## 4. Design system components (mới `src/components/ui/`)
| Component | Vai trò |
|---|---|
| `SectionCard` | Thẻ mục có header (tiêu đề + mô tả + action) |
| `EmptyState` | Trạng thái rỗng chuẩn (icon + tiêu đề + mô tả + action) |
| `StatusBadge` | Map trạng thái nghiệp vụ → tone + nhãn VN nhất quán |
| `InlineAlert` | Thông báo success/error/warning/info (role a11y) |
| `ActionBar` | Thanh filter/action đầu bảng |
| `DataTableShell` | Khung bảng bo góc + cuộn ngang mobile (lớp `.dt`) |
| `SkeletonBlock` | Khối "đang tải" |
| `FormField` + `fieldClass` | Bọc trường form + class input dùng chung |

Nâng cấp sẵn có: `Button` (primary indigo + `danger` + size `sm/md` + focus ring, backward-compatible);
`PageHeader` (thêm `eyebrow`/`actions`). `globals.css`: `:focus-visible`, `::selection`, lớp `.dt`, font smoothing.

## 5. Admin portal polish
- `Button` primary đồng bộ indigo trên toàn bộ Admin (dashboard/reports/settings/notifications…).
- `/admin/students`: `EmptyState` (thay dòng text) + `StatusBadge` cho active/inactive; giữ nguyên
  filter/pagination/RLS read-only.
- Header/quick-action đồng bộ qua `PageHeader`/`Card`.

## 6. Secretary portal polish
- Dashboard: `EmptyState` cho "buổi hôm nay / sắp tới".
- Form nhập (students/sessions/leave/import) hưởng lợi tự động từ `Button`/`fieldClass`/focus ring;
  cảnh báo "AI đọc — cần kiểm tra" ở import giữ nguyên (chỉ đồng bộ style qua design system).

## 7. Parent portal polish
- Dashboard: `InlineAlert` warning cho "chưa liên kết học sinh" (thay Card vàng tự viết) + `EmptyState`
  cho điểm danh gần đây.
- Profile/schedule/attendance/leave/notifications đồng bộ badge/empty/button; giữ note "liên hệ Bí thư"
  (Parent KHÔNG tự sửa dữ liệu học sinh).

## 8. Public/auth polish
- `LoginForm` (dùng cho cả `/user/login` và `/admin/login`): `FormField` + `fieldClass` + `InlineAlert`.
- Public/User **KHÔNG** có link Admin (giữ tách cổng 10C); `/admin/login` không có forgot-password công khai;
  `/forgot-password` chỉ cổng User. Copy giữ nguyên, rõ ràng.

## 9. Responsive/accessibility pass
- `:focus-visible` indigo rõ (chỉ khi bàn phím); Button có focus ring + trạng thái disabled/pending.
- Bảng: `DataTableShell` cuộn ngang mobile; lớp `.dt` spacing header/cell nhất quán.
- Form có `<label>` qua `FormField`; input đủ cao (h-11), text không quá nhỏ; action quan trọng có chữ (không chỉ icon).

## 10. No-regression check
`docs/ui-ux-polish-10D.md`: KHÔNG đổi route/DB/RLS/Auth/RBAC/logic AI-DOCX-notification/bucket. Chỉ đổi lớp
trình bày. Portal separation re-check: smoke 9/9. typecheck/lint/build xanh.

## 11. Health/preflight
- `/api/health.phase` = `10d-ui-ux-polish` + cờ `uiPolishReady`/`adminUiPolishReady`/`userUiPolishReady`/
  `responsivePassReady` (giữ mọi cờ cũ, không expose secret).
- `check-production-health` default 10d; preflight OLD_PHASES thêm `10c`. **Preflight OK.**

## 12. Runtime smoke
- `/` không link Admin · `/user/login` không link Admin · `/admin/login` 200 · `/admin` chưa login redirect
  `/admin/login` (307) · `/user/secretary` chưa login redirect `/user/login` (307) → **9/9 pass**.
- `/api/health` production phase `10d-ui-ux-polish`. Endpoints `/`,`/user/login`,`/admin/login`,`/forgot-password` = 200.

## 13. Deploy/git
- `vercel deploy --prod` → READY, aliased `summer-activities-theta.vercel.app`.
- Healthcheck production PASS (phase 10d). Smoke portal 9/9.
- Stage file cụ thể theo scope 10D (không `git add .`); KHÔNG stage `.env.example`/reports cũ/xóa PROMPT-10A.

## 14. Chưa làm
- Áp `SectionCard`/`DataTableShell`/`ActionBar` cho **toàn bộ** trang bảng còn lại (áp dần ở 10E).
- Avatar private storage; Parent request-edit; realtime notification (10E).
- AI live smoke ảnh có cột giới tính/chữ ký (chưa có ảnh mẫu).
- Admin edit học sinh (hiện read-only).

## 15. Gợi ý bước tiếp theo
1. 10E: avatar + Parent request-edit (Bí thư/Admin duyệt) + realtime notification.
2. Áp design system cho các trang bảng còn lại (assignments/neighborhoods/sessions/attendance) dùng
   `DataTableShell`/`ActionBar`/`StatusBadge`.
3. Admin gán Khu phố cho 2 Bí thư (dry-run sẵn).
4. Live-test AI import ảnh có cột Nam/Nữ + chữ ký.

## 16. Các điểm dự án cần tu sửa thêm
- Component mới đã tạo nhưng nhiều trang bảng vẫn dùng markup cũ → thống nhất dần (không làm ồ ạt để tránh regression).
- Xử lý dứt điểm việc xóa `docs/reports/PROMPT-10A...` trong working tree (ngoài scope — cần user xác nhận).
- `src/modules/*` skeleton (chốt kiến trúc).
- `profiles.email` synthetic (tách "email liên hệ" nếu muốn user tự sửa).

## 17. Những việc không nên làm ngay
- Refactor ồ ạt tất cả trang sang component mới trong một PR (rủi ro regression cao).
- Đổi màu thương hiệu lớn / thêm UI library nặng.
- Cho Parent tự sửa dữ liệu học sinh; thêm realtime/avatar (thuộc 10E).
- Đụng RLS/schema/Auth để "tiện" polish.

## 18. Codex review prompt
> Review PR 10D (UI/UX polish, không đổi nghiệp vụ). Kiểm:
> 1. Có đổi route/DB/RLS/Auth/RBAC/server action nghiệp vụ nào không? (kỳ vọng: KHÔNG)
> 2. `Button`/`PageHeader` đổi có backward-compatible (props cũ vẫn chạy) không?
> 3. Component mới (`SectionCard`/`EmptyState`/`StatusBadge`/`InlineAlert`/`ActionBar`/`DataTableShell`/
>    `SkeletonBlock`/`FormField`) có props typed rõ, không chứa logic nghiệp vụ/hardcode dữ liệu không?
> 4. `StatusBadge` map trạng thái có sai nhãn/tone nào không?
> 5. Public/User còn link `/admin` nào không? Admin vẫn vào `/admin/login`?
> 6. `globals.css` `.dt`/`:focus-visible` có phá layout/accessibility trang nào không?
> 7. Có log PII hay expose secret ở health/route mới không? (kỳ vọng: KHÔNG)
