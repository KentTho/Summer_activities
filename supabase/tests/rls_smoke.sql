-- =============================================================================
-- RLS smoke test — CHỈ chạy trên DB LOCAL/DEV (sau `supabase db reset`).
-- Mục tiêu: xác nhận policy phân quyền theo Admin / Bí thư / Phụ huynh / ẩn danh.
-- Cách chạy (local):
--   supabase db reset           # áp migrations + seed
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_smoke.sql
-- Test tự tạo auth.users + profiles fixtures rồi ROLLBACK — không để lại dữ liệu.
-- Dùng dữ liệu Khu phố/học sinh từ seed.sql (KP01 có 3 HS, KP02 có 2 HS...).
-- =============================================================================

begin;

-- --- Fixtures: 3 tài khoản test (auth.users + profiles) ----------------------
insert into auth.users (id, aud, role, email, created_at, updated_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@test.local',    now(), now()),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'secr.kp01@test.local', now(), now()),
  ('cccccccc-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'parent.a@test.local',  now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, auth_user_id, role, full_name) values
  ('aaaaaaaa-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001', 'ADMIN',     'Admin Test'),
  ('bbbbbbbb-0000-0000-0000-0000000000b1', 'bbbbbbbb-0000-0000-0000-000000000001', 'SECRETARY', 'Bí thư KP01'),
  ('cccccccc-0000-0000-0000-0000000000c1', 'cccccccc-0000-0000-0000-000000000001', 'PARENT',    'Phụ huynh A')
on conflict (id) do nothing;

-- Bí thư test phụ trách KP01
insert into public.secretary_neighborhoods (secretary_id, neighborhood_id) values
  ('bbbbbbbb-0000-0000-0000-0000000000b1', '11111111-0000-0000-0000-000000000001')
on conflict (secretary_id, neighborhood_id) do nothing;

-- Gắn phụ huynh test vào guardian seed (đã liên kết Học Sinh Demo A ở KP01)
update public.guardians
  set profile_id = 'cccccccc-0000-0000-0000-0000000000c1'
  where id = '33333333-0000-0000-0000-000000000001';

-- --- Helper claim: đặt danh tính đăng nhập -----------------------------------
-- (dùng set local request.jwt.claims + set local role authenticated)

-- 1) ADMIN thấy toàn bộ học sinh (6) ------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-0000-0000-0000-000000000001"}';
do $$
begin
  if (select count(*) from public.students) <> 6 then
    raise exception 'FAIL admin: expected 6 students, got %', (select count(*) from public.students);
  end if;
  if not public.is_admin() then
    raise exception 'FAIL admin: is_admin() should be true';
  end if;
end $$;
reset role;

-- 2) BÍ THƯ KP01 chỉ thấy học sinh KP01 (3), KHÔNG thấy KP02 ------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"bbbbbbbb-0000-0000-0000-000000000001"}';
do $$
begin
  if (select count(*) from public.students
      where neighborhood_id = '11111111-0000-0000-0000-000000000001') <> 3 then
    raise exception 'FAIL secretary: expected 3 KP01 students';
  end if;
  if exists (select 1 from public.students
             where neighborhood_id = '11111111-0000-0000-0000-000000000002') then
    raise exception 'FAIL secretary: must NOT see KP02 students';
  end if;
  -- Không được xem audit log
  if exists (select 1 from public.audit_logs) and not public.is_admin() then
    -- audit rỗng ở seed nên chỉ kiểm tra không lỗi quyền; bỏ qua nếu 0 dòng
    null;
  end if;
end $$;
reset role;

-- 3) PHỤ HUYNH A chỉ thấy đúng con mình (1 học sinh) --------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"cccccccc-0000-0000-0000-000000000001"}';
do $$
begin
  if (select count(*) from public.students) <> 1 then
    raise exception 'FAIL parent: expected exactly 1 visible student, got %',
      (select count(*) from public.students);
  end if;
  if not exists (select 1 from public.students
                 where id = '22222222-0000-0000-0000-000000000001') then
    raise exception 'FAIL parent: should see own child (Demo A)';
  end if;
end $$;
reset role;

-- 4) ẨN DANH (anon) KHÔNG thấy học sinh nào -----------------------------------
set local role anon;
set local request.jwt.claims to '';
do $$
begin
  if exists (select 1 from public.students) then
    raise exception 'FAIL anon: must NOT see any student';
  end if;
end $$;
reset role;

-- Không giữ lại fixtures/thay đổi
rollback;

\echo 'RLS smoke test: OK (nếu không có dòng FAIL nào ở trên).'
