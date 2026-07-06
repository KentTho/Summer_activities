-- =============================================================================
-- 07 · Attendance workflow enablers (ADDITIVE — không phá dữ liệu cũ)
-- 1) activity_sessions.closed_at: vòng đời buổi (null = đang mở, có = ĐÃ CHỐT).
-- 2) Sửa policy session_neighborhoods INSERT để Bí thư gắn được Khu phố cho buổi
--    do CHÍNH MÌNH tạo (trước đây bị deadlock: can_access_session cần đã có link).
-- KHÔNG drop bảng/cột. KHÔNG disable RLS. KHÔNG dùng using(true). Idempotent.
-- =============================================================================

-- --- 1) Vòng đời buổi: cột closed_at (additive, nullable) ---------------------
alter table public.activity_sessions
  add column if not exists closed_at timestamptz;

-- --- 2) Sửa deadlock tạo buổi cho Bí thư -------------------------------------
-- Vấn đề: buổi mới CHƯA có session_neighborhoods nào => can_access_session()=false
-- => Bí thư không insert được link đầu tiên. Cho phép NGƯỜI TẠO buổi gắn Khu phố
-- mà họ được phân công phụ trách. Vẫn chặt: chỉ creator + chỉ Khu phố trong phạm vi.
drop policy if exists snb_insert on public.session_neighborhoods;
create policy snb_insert on public.session_neighborhoods for insert to authenticated
  with check (
    public.is_admin()
    or public.can_access_session(session_id)
    or exists (
      select 1
      from public.activity_sessions s
      where s.id = session_neighborhoods.session_id
        and s.created_by = public.current_profile_id()
        and public.can_access_neighborhood(session_neighborhoods.neighborhood_id)
    )
  );
