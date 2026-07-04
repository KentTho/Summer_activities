-- Seed tối thiểu (Phase 1: placeholder, chưa có bảng).
-- Phase 2 sẽ seed danh mục Khu phố mẫu và 1 tài khoản Admin khởi tạo.
-- KHÔNG đặt mật khẩu plaintext ở đây — dùng Supabase Auth (spec §7).

-- Ví dụ (bật lại sau khi migration tạo bảng neighborhoods):
-- insert into public.neighborhoods (code, name, status)
-- values ('KP01', 'Khu phố 1', 'active');
