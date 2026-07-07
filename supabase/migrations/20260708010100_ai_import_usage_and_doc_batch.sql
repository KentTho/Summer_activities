-- =============================================================================
-- 09C · AI import hardening (ADDITIVE)
--  1) uploaded_documents.import_batch_id — liên kết ảnh gốc với lô import.
--  2) ai_import_usage — đếm lượt gọi AI theo (profile, ngày) để bảo vệ quota.
--  3) RPC consume_ai_import_quota() — tăng lượt an toàn (atomic) dưới hạn mức.
--  4) RPC my_ai_import_usage_today() — đọc lượt đã dùng hôm nay (cho UI).
-- KHÔNG drop/disable RLS. KHÔNG dùng using(true). KHÔNG reset DB.
-- =============================================================================

-- 1) Liên kết ảnh gốc ↔ lô import (nullable, không phá dữ liệu cũ).
alter table public.uploaded_documents
  add column if not exists import_batch_id uuid references public.import_batches (id) on delete set null;
create index if not exists idx_uploaded_docs_batch on public.uploaded_documents (import_batch_id);

-- 2) Bảng đếm lượt AI import theo ngày.
create table if not exists public.ai_import_usage (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  used_on     date not null default current_date,
  count       int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (profile_id, used_on)
);
create index if not exists idx_ai_import_usage_profile on public.ai_import_usage (profile_id, used_on);

alter table public.ai_import_usage enable row level security;

-- Chỉ đọc: Admin xem tất cả; user xem lượt của chính mình.
drop policy if exists ai_usage_select on public.ai_import_usage;
create policy ai_usage_select on public.ai_import_usage for select to authenticated
  using (public.is_admin() or profile_id = public.current_profile_id());
-- KHÔNG có policy insert/update/delete cho user → ghi CHỈ qua RPC SECURITY DEFINER.

grant select on public.ai_import_usage to authenticated;

-- 3) Tăng lượt an toàn: chỉ tăng nếu chưa vượt hạn (atomic qua WHERE count < limit).
create or replace function public.consume_ai_import_quota(p_limit int)
returns table(allowed boolean, used int, limit_value int)
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := public.current_profile_id();
  v_count int;
begin
  if pid is null then
    return query select false, 0, p_limit;
    return;
  end if;

  insert into public.ai_import_usage (profile_id, used_on, count)
    values (pid, current_date, 0)
    on conflict (profile_id, used_on) do nothing;

  update public.ai_import_usage
    set count = count + 1, updated_at = now()
    where profile_id = pid and used_on = current_date and count < p_limit
    returning count into v_count;

  if not found then
    select count into v_count from public.ai_import_usage
      where profile_id = pid and used_on = current_date;
    return query select false, coalesce(v_count, p_limit), p_limit;
    return;
  end if;

  return query select true, v_count, p_limit;
end;
$$;

grant execute on function public.consume_ai_import_quota(int) to authenticated;

-- 4) Đọc lượt đã dùng hôm nay của chính mình (cho UI hiển thị lượt còn lại).
create or replace function public.my_ai_import_usage_today()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select count from public.ai_import_usage
    where profile_id = public.current_profile_id() and used_on = current_date
  ), 0);
$$;

grant execute on function public.my_ai_import_usage_today() to authenticated;
