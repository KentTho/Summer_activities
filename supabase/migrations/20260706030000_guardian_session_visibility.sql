-- =============================================================================
-- 07c · Phụ huynh xem được BUỔI của con (lịch sinh hoạt)
-- Vấn đề: nhánh "guardian" trong sessions_select JOIN trực tiếp session_neighborhoods,
-- nhưng snb_select KHÔNG cấp quyền cho phụ huynh => subquery (chịu RLS của bảng được
-- tham chiếu) trả rỗng => phụ huynh không thấy buổi của con.
-- Cách sửa: helper SECURITY DEFINER (bỏ qua RLS bên trong) + dùng ở sessions_select
-- và snb_select. ADDITIVE, phạm vi hẹp (đúng phụ huynh của học sinh trong buổi).
-- =============================================================================

create or replace function public.is_guardian_of_session(target_session uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.session_neighborhoods snb
    join public.students s on s.neighborhood_id = snb.neighborhood_id
    where snb.session_id = target_session
      and public.is_guardian_of(s.id)
  );
$$;

grant execute on function public.is_guardian_of_session(uuid) to anon, authenticated;

-- sessions_select: thay nhánh guardian bằng helper (bỏ qua RLS nội bộ, không rỗng).
drop policy if exists sessions_select on public.activity_sessions;
create policy sessions_select on public.activity_sessions for select to authenticated
  using (
    public.is_admin()
    or created_by = public.current_profile_id()
    or public.can_access_session(id)
    or public.is_guardian_of_session(id)
  );

-- snb_select: cho phụ huynh đọc link Khu phố của buổi con mình tham gia (để hiển thị).
drop policy if exists snb_select on public.session_neighborhoods;
create policy snb_select on public.session_neighborhoods for select to authenticated
  using (
    public.is_admin()
    or public.can_access_neighborhood(neighborhood_id)
    or public.can_access_session(session_id)
    or public.is_guardian_of_session(session_id)
  );
