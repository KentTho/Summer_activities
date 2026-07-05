# Kế hoạch bảo mật (tóm tắt spec §7)

## RBAC + phạm vi
Role `ADMIN` / `SECRETARY` / `PARENT` (`modules/auth/domain/roles.ts`). RBAC **chưa đủ** — phạm vi
thật ghép thêm bởi **Khu phố** và **quyền đặc biệt theo session chung**.

## RLS (chặn cuối cùng)
Bật trên mọi bảng nghiệp vụ, viết qua helper function thay vì lặp policy dài. **Tầng UI/`proxy.ts`
chỉ là lớp tiện lợi**; chặn cuối cùng ở Postgres RLS để tránh lộ dữ liệu do bug frontend/API.

## Audit log (bắt buộc)
Log: tạo/sửa/xóa học sinh, gán Bí thư, reset mật khẩu, tạo/sửa session, điểm danh, import, export,
đổi template, đổi cấu hình. Nội dung: ai/khi nào/entity/before-after/IP/user-agent/request-id.
Không cho sửa/xóa audit log từ UI thường.

## Input validation (2 tầng)
Client form + server schema bằng **Zod** (`lib/validation`). Chuẩn hóa số điện thoại/ngày sinh/tên
trường/Khu phố trước khi ghi. Chặn mass assignment bằng **whitelist field** cho từng use case.

## File upload
Whitelist định dạng (ảnh, PDF scan, DOCX template — xem `lib/security`). Chặn `.docm`/macro. Kiểm
mime + extension + size + hash. Bucket riêng **không public**; phát qua signed URL ngắn hạn.

## Mật khẩu
Không lưu plaintext ở bất kỳ bảng nào. Dùng Supabase Auth để băm/quản lý. Reset qua link đặt lại
hoặc mật khẩu tạm buộc đổi lần đầu. Bí thư/Admin không bao giờ xem mật khẩu thật.

## Theme settings an toàn
Chỉ field whitelist (`SYSTEM_SETTINGS_WHITELIST` trong `lib/security`): tên hệ thống, logo, mã màu
hợp lệ, footer. **Không** có trường nhập CSS/JS/HTML tùy ý.

## Rate limiting (đề xuất)
Đăng nhập (theo IP + user) · reset password (chặt hơn + cooldown) · import/export (theo user) ·
API đọc dữ liệu nhạy cảm (throttle ở edge/proxy).

## Environment variables
`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(tên cũ `NEXT_PUBLIC_SUPABASE_ANON_KEY` vẫn đọc được — backward-compat) · `SUPABASE_SERVICE_ROLE_KEY` ·
`APP_BASE_URL` · (sau) `AUDIT_LOG_SECRET`, `DOCX_TEMPLATE_BUCKET`, `IMPORT_BUCKET`, OCR key.
Xem `.env.example`. **Không hardcode secret; không commit `.env.local`.**
