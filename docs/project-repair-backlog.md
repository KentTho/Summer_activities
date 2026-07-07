# Project Repair Backlog

> Tạo ở **Prompt 09A**. Theo dõi việc cần sửa/nâng cấp, tách rõ: đã xử lý · còn lại · không làm ngay.

## Đã xử lý ở 09A
- [x] Ép đổi mật khẩu lần đầu (`must_change_password` → `/change-password`, xóa cờ sau khi đổi).
- [x] DOCX placeholder-merge tối giản từ mẫu upload (`{{...}}`) + fallback DOCX tự sinh.
- [x] Dọn dead code `src/lib/mock/*` (không còn import).
- [x] Phân trang `/admin/students` (page/pageSize whitelist, giữ search/filter).
- [x] `/api/health` phase `09a-production-hardening` + cờ tính năng.
- [x] Preflight script (`npm run preflight`) + playbook vận hành (5 docs).
- [x] Docs OCR production (`ocr-production-setup.md`).

## Còn lại trước khi "UI polish"
1. **Monitoring/logging nhẹ**: alert khi `/api/health` fail; gom log lỗi server (không PII); uptime check.
2. **Load test sau MVP**: mô phỏng ghi điểm danh dồn cuối buổi; xem index/độ trễ.
3. **OCR image → private storage + audit**: hiện OCR không lưu ảnh gốc.
4. **Advanced DOCX template engine**: vòng lặp/điều kiện/bảng động, placeholder bị tách run.
5. **Dọn `DemoNotice` component** nếu vẫn không dùng (hiện chỉ export, không render ở app).
6. **Đồng bộ Postgres local `major_version`** (15 local vs 17 remote) — chỉ ảnh hưởng dev.

## Không nên làm ngay (tránh lan man)
- Logout-all / token-version thật (chỉ backlog trong `auth-session-hardening.md` — chưa cần).
- MFA/OTP điện thoại thật, rate-limit đăng nhập nâng cao.
- UI polish toàn hệ thống (màu/nhịp/skeleton…) — làm sau khi nghiệp vụ/vận hành ổn.
- Viết engine DOCX đầy đủ khi placeholder-merge tối giản đã đủ cho biểu mẫu hiện tại.
- Thêm thư viện nặng cho ZIP/DOCX khi bản zero-dependency đang chạy tốt.

## Ưu tiên đề xuất
1. Monitoring/logging nhẹ → 2. Load test sau MVP → 3. OCR image private storage →
4. Advanced DOCX template → 5. UI polish toàn hệ thống.
