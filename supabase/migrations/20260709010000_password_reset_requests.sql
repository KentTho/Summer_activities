-- =============================================================================
-- 09E · Yêu cầu đặt lại mật khẩu (ADDITIVE). KHÔNG drop/disable RLS, KHÔNG using(true).
--  - Người dùng quên mật khẩu gửi yêu cầu (KHÔNG tự đổi) → Admin xử lý (cấp mật khẩu tạm).
--  - Anon KHÔNG đọc được bảng. Ghi CHỈ qua RPC SECURITY DEFINER (trung lập, chống spam).
-- =============================================================================

create table if not exists public.password_reset_requests (
  id                 uuid primary key default gen_random_uuid(),
  identifier         text not null,
  portal             text not null check (portal in ('ADMIN','USER')),
  requested_role     text,
  matched_profile_id uuid references public.profiles (id) on delete set null,
  status             text not null default 'PENDING' check (status in ('PENDING','RESOLVED','REJECTED')),
  note               text,
  created_at         timestamptz not null default now(),
  resolved_at        timestamptz,
  resolved_by        uuid references public.profiles (id) on delete set null
);
create index if not exists idx_prr_status on public.password_reset_requests (status, created_at desc);

alter table public.password_reset_requests enable row level security;

-- Chỉ Admin đọc/cập nhật. KHÔNG mở cho anon/user thường. KHÔNG có policy insert →
-- ghi chỉ qua RPC SECURITY DEFINER bên dưới (không lộ tồn tại tài khoản, chống spam 24h).
drop policy if exists prr_admin_select on public.password_reset_requests;
create policy prr_admin_select on public.password_reset_requests for select to authenticated
  using (public.is_admin());
drop policy if exists prr_admin_update on public.password_reset_requests;
create policy prr_admin_update on public.password_reset_requests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Tạo yêu cầu đặt lại mật khẩu.
--  * Trung lập: luôn trả void; KHÔNG tiết lộ tài khoản có tồn tại hay không.
--  * Chống spam: cùng identifier còn PENDING trong 24h ⇒ không tạo trùng.
--  * Best-effort khớp hồ sơ (phone/email/synthetic email) để Admin xử lý nhanh.
create or replace function public.request_password_reset(p_identifier text, p_portal text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_identifier text := btrim(coalesce(p_identifier, ''));
  v_portal     text := upper(coalesce(p_portal, 'USER'));
  v_digits     text;
  v_local      text;
  v_match_id   uuid;
  v_match_role text;
begin
  if v_identifier = '' or length(v_identifier) > 120 then
    return;
  end if;
  if v_portal not in ('ADMIN','USER') then
    v_portal := 'USER';
  end if;

  -- Chống spam / trùng lặp.
  if exists (
    select 1 from public.password_reset_requests
    where lower(identifier) = lower(v_identifier)
      and status = 'PENDING'
      and created_at > now() - interval '24 hours'
  ) then
    return;
  end if;

  v_digits := regexp_replace(v_identifier, '[^0-9]', '', 'g');
  v_local  := lower(regexp_replace(v_identifier, '[^a-zA-Z0-9]', '', 'g'));

  select p.id, p.role into v_match_id, v_match_role
  from public.profiles p
  where (
      p.phone = v_identifier
      or lower(p.email) = lower(v_identifier)
      or (v_digits <> '' and lower(p.email) = v_digits || '@sinhhoathe.local')
      or (v_local <> '' and lower(p.email) = v_local || '@sinhhoathe.local')
    )
    and (
      (v_portal = 'ADMIN' and p.role = 'ADMIN')
      or (v_portal = 'USER' and p.role in ('SECRETARY','PARENT'))
    )
  limit 1;

  insert into public.password_reset_requests (identifier, portal, requested_role, matched_profile_id)
  values (v_identifier, v_portal, v_match_role, v_match_id);
end;
$$;

grant execute on function public.request_password_reset(text, text) to anon, authenticated;
