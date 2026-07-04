-- =============================================================================
-- 04B · RLS helper functions (RBAC + phạm vi Khu phố/buổi)
-- Tất cả là SECURITY DEFINER, STABLE, search_path cố định — chạy dưới quyền owner
-- nên KHÔNG bị RLS chặn khi policy gọi lại (tránh đệ quy vô hạn trên profiles).
-- Trả về false/null an toàn khi auth.uid() null (khách ẩn danh).
-- =============================================================================

-- Profile id của người đăng nhập hiện tại.
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id from public.profiles p where p.auth_user_id = auth.uid();
$$;

-- Vai trò hiện tại (tránh tên 'current_role' vì trùng từ khoá Postgres).
create or replace function public.current_profile_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.auth_user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.auth_user_id = auth.uid() and p.role = 'ADMIN' and p.active
  );
$$;

create or replace function public.is_secretary()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.auth_user_id = auth.uid() and p.role = 'SECRETARY' and p.active
  );
$$;

-- Bí thư (hoặc Admin) có quyền trên một Khu phố nếu được gán phụ trách.
create or replace function public.can_access_neighborhood(target_neighborhood uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.profiles p
    join public.secretary_neighborhoods sn on sn.secretary_id = p.id
    where p.auth_user_id = auth.uid()
      and p.active
      and sn.neighborhood_id = target_neighborhood
  );
$$;

-- Quyền trên một học sinh = quyền trên Khu phố gốc của học sinh đó.
create or replace function public.can_access_student(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.students s
    where s.id = target_student
      and public.can_access_neighborhood(s.neighborhood_id)
  );
$$;

-- Quyền trên một buổi = gán bất kỳ Khu phố tham gia HOẶC có grant đặc biệt.
create or replace function public.can_access_session(target_session uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.session_neighborhoods snb
      where snb.session_id = target_session
        and public.can_access_neighborhood(snb.neighborhood_id)
    )
    or exists (
      select 1
      from public.session_permissions sp
      join public.profiles p on p.id = sp.secretary_id
      where sp.session_id = target_session
        and p.auth_user_id = auth.uid()
        and p.active
    );
$$;

-- Phụ huynh là người giám hộ (đã liên kết) của một học sinh.
create or replace function public.is_guardian_of(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_guardians sg
    join public.guardians g on g.id = sg.guardian_id
    join public.profiles p on p.id = g.profile_id
    where sg.student_id = target_student
      and p.auth_user_id = auth.uid()
      and p.active
  );
$$;

-- Cho phép gọi từ client (anon trả về false/null an toàn).
grant execute on function
  public.current_profile_id(),
  public.current_profile_role(),
  public.is_admin(),
  public.is_secretary(),
  public.can_access_neighborhood(uuid),
  public.can_access_student(uuid),
  public.can_access_session(uuid),
  public.is_guardian_of(uuid)
to anon, authenticated;
