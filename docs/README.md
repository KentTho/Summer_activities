# Tài liệu dự án — Điểm danh sinh hoạt hè

Docs nền được rút ra từ spec gốc (`spec/diem-danh-sinh-hoat-he-spec.html`).

| Tài liệu | Nội dung |
| --- | --- |
| [00-overview.md](./00-overview.md) | Mục tiêu, người dùng, phạm vi MVP |
| [architecture.md](./architecture.md) | Clean Architecture + bản đồ thư mục |
| [data-model.md](./data-model.md) | Bảng chính & quan hệ (Supabase Postgres) |
| [security.md](./security.md) | RBAC, RLS, upload, audit, env |
| [auth-strategy.md](./auth-strategy.md) | Tách cổng Admin/User, redirect theo vai trò, chiến lược tài khoản |
| [ocr-import.md](./ocr-import.md) | Import giấy tờ qua staging + OCR (kế hoạch) |
| [docx-export.md](./docx-export.md) | Xuất báo cáo DOCX theo template (kế hoạch) |
| [roadmap.md](./roadmap.md) | Lộ trình theo phase & vị trí Phase 1 |
| [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md) | **Tracker tiến độ — tick sau mỗi prompt** |
| [reports/](./reports/) | Báo cáo theo từng prompt (03A, 03B, 03C…) |
| [spec/](./spec/) | **Bản spec gốc (đã COPY, không chỉnh sửa)** |

> Nguồn sự thật đầy đủ vẫn là spec gốc. Các file `.md` ở đây là bản tóm tắt phục vụ triển khai.
