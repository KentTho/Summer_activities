-- =============================================================================
-- 07b · sessions_select: cho phép NGƯỜI TẠO xem buổi của chính mình
-- Lý do: khi Bí thư vừa tạo buổi (chưa gắn session_neighborhoods) thì
-- can_access_session()=false => insert...returning/select bị RLS chặn, và buổi
-- "mồ côi" (lỗi gắn Khu phố) sẽ vô hình. Thêm nhánh created_by = current_profile_id().
-- ADDITIVE: chỉ MỞ RỘNG SELECT cho đúng người tạo; KHÔNG dùng using(true).
-- =============================================================================
drop policy if exists sessions_select on public.activity_sessions;
create policy sessions_select on public.activity_sessions for select to authenticated
  using (
    public.is_admin()
    or created_by = public.current_profile_id()
    or public.can_access_session(id)
    or exists (
      select 1
      from public.session_neighborhoods snb
      join public.students s on s.neighborhood_id = snb.neighborhood_id
      where snb.session_id = activity_sessions.id and public.is_guardian_of(s.id)
    )
  );
