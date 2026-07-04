-- =============================================================================
-- SEED — CHỈ DÙNG LOCAL / DEV / STAGING. KHÔNG chạy trên production.
-- Dữ liệu GIẢ, không phải trẻ em thật. Chạy qua `supabase db reset` (superuser,
-- bypass RLS). Idempotent: fixed UUID + on conflict do nothing.
-- KHÔNG seed auth.users / profiles ở đây — tài khoản do Auth phase tạo (Admin tạo).
-- =============================================================================

-- --- Khu phố -----------------------------------------------------------------
insert into public.neighborhoods (id, code, name, active) values
  ('11111111-0000-0000-0000-000000000001', 'KP01', 'Khu phố 1', true),
  ('11111111-0000-0000-0000-000000000002', 'KP02', 'Khu phố 2', true),
  ('11111111-0000-0000-0000-000000000003', 'KP03', 'Khu phố 3', true),
  ('11111111-0000-0000-0000-000000000004', 'KP04', 'Khu phố 4', true),
  ('11111111-0000-0000-0000-000000000005', 'KP05', 'Khu phố 5', false)
on conflict (id) do nothing;

-- --- Phụ huynh (chưa gắn tài khoản đăng nhập) --------------------------------
insert into public.guardians (id, full_name, phone, email) values
  ('33333333-0000-0000-0000-000000000001', 'Nguyễn Văn Cường', '0900 000 111', null),
  ('33333333-0000-0000-0000-000000000002', 'Trần Thị Diệu',   '0900 000 222', null)
on conflict (id) do nothing;

-- --- Học sinh (dữ liệu giả) --------------------------------------------------
insert into public.students (id, full_name, birth_year, neighborhood_id, active) values
  ('22222222-0000-0000-0000-000000000001', 'Học Sinh Demo A', 2013, '11111111-0000-0000-0000-000000000001', true),
  ('22222222-0000-0000-0000-000000000002', 'Học Sinh Demo B', 2014, '11111111-0000-0000-0000-000000000001', true),
  ('22222222-0000-0000-0000-000000000003', 'Học Sinh Demo C', 2012, '11111111-0000-0000-0000-000000000001', true),
  ('22222222-0000-0000-0000-000000000004', 'Học Sinh Demo D', 2015, '11111111-0000-0000-0000-000000000002', true),
  ('22222222-0000-0000-0000-000000000005', 'Học Sinh Demo E', 2013, '11111111-0000-0000-0000-000000000002', true),
  ('22222222-0000-0000-0000-000000000006', 'Học Sinh Demo F', 2014, '11111111-0000-0000-0000-000000000003', true)
on conflict (id) do nothing;

insert into public.student_guardians (student_id, guardian_id, relationship) values
  ('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Cha'),
  ('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'Mẹ')
on conflict (student_id, guardian_id) do nothing;

-- --- Buổi sinh hoạt ----------------------------------------------------------
insert into public.activity_sessions (id, title, session_date, start_time, session_type, location) values
  ('44444444-0000-0000-0000-000000000001', 'Sinh hoạt hè tuần 5', '2026-07-05', '07:30', 'REGULAR', 'Nhà văn hoá Khu phố 1'),
  ('44444444-0000-0000-0000-000000000002', 'Ngày hội đọc sách',   '2026-07-07', '08:00', 'JOINT',   'Trung tâm sinh hoạt phường'),
  ('44444444-0000-0000-0000-000000000003', 'Sinh hoạt hè tuần 5 (KP2)', '2026-07-06', '15:00', 'REGULAR', 'Sân chơi Khu phố 2')
on conflict (id) do nothing;

insert into public.session_neighborhoods (session_id, neighborhood_id) values
  ('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001'),
  ('44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001'),
  ('44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002'),
  ('44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002')
on conflict (session_id, neighborhood_id) do nothing;

-- --- Điểm danh buổi 1 --------------------------------------------------------
insert into public.attendance_records (session_id, student_id, status) values
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'PRESENT'),
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'EXCUSED'),
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000003', 'UNEXCUSED')
on conflict (session_id, student_id) do nothing;

-- --- Đơn xin nghỉ ------------------------------------------------------------
insert into public.leave_requests (id, student_id, session_id, reason, status) values
  ('55555555-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000001', 'Về quê thăm ông bà', 'SUBMITTED'),
  ('55555555-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000002', 'Đi khám sức khoẻ định kỳ', 'ACKNOWLEDGED')
on conflict (id) do nothing;

-- --- Thông báo ---------------------------------------------------------------
insert into public.notifications (id, title, body, scope, neighborhood_id, session_id) values
  ('66666666-0000-0000-0000-000000000001', 'Đổi giờ buổi tuần 5', 'Buổi sinh hoạt Khu phố 1 dời sang 07:30 sáng 05/07.', 'NEIGHBORHOOD', '11111111-0000-0000-0000-000000000001', null),
  ('66666666-0000-0000-0000-000000000002', 'Lịch nghỉ lễ', 'Tạm nghỉ sinh hoạt ngày 02/09 theo thông báo chung.', 'SYSTEM', null, null)
on conflict (id) do nothing;

-- --- Mẫu báo cáo DOCX (document_id để null ở seed) --------------------------
insert into public.export_templates (id, name, active) values
  ('77777777-0000-0000-0000-000000000001', 'Danh sách điểm danh theo buổi', true),
  ('77777777-0000-0000-0000-000000000002', 'Tổng hợp nghỉ theo tháng', true)
on conflict (id) do nothing;

-- --- Cấu hình hệ thống (single row) -----------------------------------------
insert into public.system_settings (id, system_name, primary_color, public_footer_text) values
  (true, 'Điểm danh sinh hoạt hè', '#4f46e5', '© 2026 Ban chỉ huy hè phường (demo)')
on conflict (id) do nothing;
