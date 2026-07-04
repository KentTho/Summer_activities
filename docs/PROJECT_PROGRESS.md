# PROJECT PROGRESS — Web-App Điểm danh sinh hoạt hè

## 1. Nguyên tắc cập nhật
- Sau mỗi prompt hoàn thành, phải tick checklist tương ứng.
- Mỗi prompt phải tạo report riêng trong `docs/reports/`.
- Không tick hạng mục nếu chỉ mới UI demo mà chưa có logic thật.
- Nếu một phần chỉ là UI shell, ghi rõ là "UI shell", không ghi là đã hoàn thành nghiệp vụ thật.

## 2. Tổng quan trạng thái

| Phase | Trạng thái | Ghi chú |
|---|---|---|
| Phase 1 — Scaffold | ✅ Done | Next.js + Supabase shell |
| Phase 2 — Route split + UI shell | ✅ Done | Admin/User portal split |
| Phase 3 — User portal UI pages | ✅ Done (UI shell + mock) | Prompt 03C — chưa nối DB thật |
| Phase 4 — Admin management UI pages | ⬜ Pending | Làm sau |
| Phase 5 — Supabase schema + RLS | ⬜ Pending | Chưa làm DB thật |
| Phase 6 — Auth thật + RBAC guard | ⬜ Pending | Chưa làm |
| Phase 7 — CRUD thật | ⬜ Pending | Chưa làm |
| Phase 8 — Attendance workflow thật | ⬜ Pending | Chưa làm |
| Phase 9 — Import/OCR staging thật | ⬜ Pending | Chưa làm |
| Phase 10 — DOCX export thật | ⬜ Pending | Chưa làm |
| Phase 11 — Notification thật | ⬜ Pending | Chưa làm |
| Phase 12 — Vercel deploy + hardening | ⬜ Pending | Chưa làm |

## 3. Checklist chi tiết

### Prompt 03A — Review + GitHub + Supabase config
- [x] Review scaffold
- [x] Local run
- [x] GitHub push lần đầu
- [x] Supabase env/config mẫu
- [x] Report 03A

### Prompt 03B — Split Admin/User + UI shell + docs
- [x] Tách route Admin/User
- [x] Nâng shell UI
- [x] Auth strategy doc
- [x] OCR/import doc
- [x] DOCX export doc
- [x] Report 03B
- [x] Commit/push 03B (gộp cùng 03C)

### Prompt 03C — User portal pages
- [x] Secretary dashboard nâng cấp
- [x] Secretary sessions page
- [x] Secretary attendance page
- [x] Secretary students page
- [x] Secretary leave requests page
- [x] Secretary import page
- [x] Secretary reports page
- [x] Secretary notifications page
- [x] Parent dashboard nâng cấp
- [x] Parent schedule page
- [x] Parent leave request page
- [x] Parent notifications page
- [x] Parent attendance history page
- [x] Mock data tách riêng (`src/lib/mock/`)
- [x] Report 03C
- [x] Lint/typecheck/build pass
- [x] Commit/push 03C

> Ghi chú: toàn bộ trang 03C là **UI shell + mock data** (nhãn "UI demo" trên mỗi
> trang). Chưa có nghiệp vụ thật — không tick mục CRUD/attendance/DB ở các phase sau.

## 4. Next planned prompts
1. Prompt 03D — Admin management UI pages
2. Prompt 04 — Supabase schema + RLS + seed data
3. Prompt 05 — Auth thật + RBAC guard
4. Prompt 06 — CRUD Khu phố/Bí thư/Học sinh
5. Prompt 07 — Attendance + leave request thật
6. Prompt 08 — Import/OCR staging thật
7. Prompt 09 — DOCX export thật
8. Prompt 10 — Notification thật + deploy Vercel

## 5. Rủi ro đang mở
- Chưa có DB/RLS thật nên mọi UI hiện tại chỉ là demo.
- Chưa có auth thật nên route guard chưa bảo vệ dữ liệu.
- OCR/import phải qua staging review, không được auto-import thẳng.
- DOCX export phải render server-side và log audit khi làm thật.