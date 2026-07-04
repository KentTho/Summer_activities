# Báo cáo PROMPT 03C — Trang cổng Người dùng + Tracker tiến độ

- **Ngày:** 2026-07-04
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-03B-report.md`
- **Phạm vi:** hoàn thiện UI/UX các trang cổng **Bí thư** và **Phụ huynh/Học sinh**
  bằng **mock data có kiểm soát**. **Không** làm auth/DB/CRUD/OCR/DOCX/API thật.

---

## A — Hiện trạng trước khi làm

Đã có (03B): tách cổng Admin/User, shell mobile-first, `/user/secretary` &
`/user/parent` mới ở mức dashboard placeholder, docs auth/OCR/DOCX. 03B **chưa
commit/push** → prompt này commit/push gộp 03B + 03C.

---

## B — Trang đã tạo

### Cổng Bí thư (`/user/secretary/*`) — 8 trang
| Route | Nội dung |
| --- | --- |
| `/user/secretary` | Dashboard: KPI (học sinh, buổi sắp tới, cần điểm danh, đơn chờ), buổi kế tiếp, đơn chờ xử lý |
| `/user/secretary/students` | Danh sách học sinh (tên giả) theo Khu phố, trạng thái đang học/ngừng |
| `/user/secretary/sessions` | Danh sách buổi thường/buổi chung, khu phố tham gia |
| `/user/secretary/attendance` | Roster điểm danh 1 buổi + tổng hợp có mặt/có phép/không phép |
| `/user/secretary/leave-requests` | Danh sách đơn xin nghỉ + hành động ghi nhận/từ chối (disabled) |
| `/user/secretary/import` | Vùng tải ảnh/PDF (staging) + lịch sử lô import (OCR/nhập tay) |
| `/user/secretary/notifications` | Soạn nhanh (disabled) + thông báo đã gửi |
| `/user/secretary/reports` | Danh mục báo cáo DOCX + nút "Xuất DOCX (chưa kết nối)" |

### Cổng Phụ huynh/Học sinh (`/user/parent/*`) — 5 trang
| Route | Nội dung |
| --- | --- |
| `/user/parent` | Dashboard: buổi kế tiếp, thông báo mới của con |
| `/user/parent/schedule` | Lịch sinh hoạt sắp tới, lối xin phép nghỉ |
| `/user/parent/attendance` | Lịch sử điểm danh của con + tổng hợp |
| `/user/parent/leave-requests` | Form gửi đơn (disabled) + đơn đã gửi |
| `/user/parent/notifications` | Thông báo theo Khu phố/buổi, đánh dấu chưa đọc |

Tất cả trang **mobile-first** (stack trên điện thoại, sidebar từ md+), mỗi trang
mang nhãn **"UI demo · chưa kết nối dữ liệu"** (banner chung trong `DashboardShell`)
và các nút nghiệp vụ đều **disabled** kèm chú thích "(chưa kết nối)".

---

## C — Mock data (tách khỏi UI)

Thư mục mới `src/lib/mock/` — **dữ liệu giả, không phải trẻ em thật**:

- `types.ts` — view-model types (bám domain enum, không phải schema DB).
- `data.ts` — dataset demo: 2 Khu phố, 6 học sinh, 3 buổi, điểm danh, đơn nghỉ,
  thông báo, lô import, lịch sử điểm danh của con. Ngày để **chuỗi tĩnh** (tránh
  lệch SSR/hydration).
- `status.ts` — ánh xạ trạng thái → tone Badge + nhãn import.
- `index.ts` — barrel.

Khi nối DB thật: thay lớp `mock` bằng truy vấn qua RLS, UI giữ nguyên nhờ dùng
chung view-model types.

---

## D — Component & Navigation

- UI mới: `Badge` (tone theo trạng thái), `StatCard` (KPI), `DemoNotice` (nhãn demo).
- `DashboardShell` render `DemoNotice` một lần → mọi trang cổng đều có nhãn.
- `nav-config.ts`: thêm **"Nhập giấy tờ"** (Bí thư) và **"Lịch sử điểm danh"**
  (Phụ huynh); active-state đã có từ `SidebarNav` (03B).

---

## E — Kiểm tra chất lượng

| Bước | Kết quả |
| --- | --- |
| `npm run lint` | ✅ Pass |
| `npm run typecheck` | ✅ Pass |
| `npm run build` | ✅ Pass — **22 route** (13 trang cổng User mới) prerender static, + Proxy |

Toàn bộ trang mới prerender **○ Static** thành công (không lỗi runtime khi render).

---

## F — Tuân thủ quy tắc

- ✅ Không auth/DB/CRUD/OCR/DOCX/API thật; nút nghiệp vụ disabled + nhãn rõ.
- ✅ Mock data là dữ liệu **giả**, tách khỏi UI; không dùng dữ liệu trẻ em thật.
- ✅ Không commit `.env.local`/`.next`/`node_modules`/secret; không dùng service role ở client.
- ✅ Không tạo route dư thừa (mọi route khớp nav + nghiệp vụ trong spec).
- ✅ Mobile-first; không làm design system phức tạp (tái dùng primitive sẵn có).

---

## G — Tiến độ & Git

- Cập nhật `docs/PROJECT_PROGRESS.md`: tick toàn bộ hạng mục 03C (UI shell + mock),
  ghi rõ **chưa** nối DB/nghiệp vụ thật.
- Commit + push gộp **03B + 03C** lên `origin/main` (xem cuối báo cáo / lịch sử git).

## Chưa làm (đúng phạm vi 03C)

Auth thật · DB schema/RLS · CRUD · attendance ghi nhận thật · OCR · DOCX render ·
notification gửi thật · gọi API. Để lại cho các prompt 03D/04+.
