-- =============================================================================
-- 04B · Core schema — Điểm danh sinh hoạt hè
-- Postgres 15 (Supabase). Bám sát docs/data-model.md và domain enums.
-- Idempotent ở mức hợp lý: create ... if not exists / guard cho enum.
-- RLS được BẬT ở migration 20260705010200_rls_policies.sql (deny-by-default).
-- KHÔNG chèn dữ liệu ở đây (xem seed.sql — chỉ local/dev).
-- =============================================================================

create extension if not exists pgcrypto;      -- gen_random_uuid()

-- --- Enums (guard để chạy lại không lỗi) ------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('ADMIN', 'SECRETARY', 'PARENT');
  end if;
  if not exists (select 1 from pg_type where typname = 'session_type') then
    create type public.session_type as enum ('REGULAR', 'JOINT');
  end if;
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type public.attendance_status as enum ('PRESENT', 'EXCUSED', 'UNEXCUSED');
  end if;
  if not exists (select 1 from pg_type where typname = 'leave_status') then
    create type public.leave_status as enum ('SUBMITTED', 'ACKNOWLEDGED', 'REJECTED');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_scope') then
    create type public.notification_scope as enum ('NEIGHBORHOOD', 'SESSION', 'SYSTEM');
  end if;
  if not exists (select 1 from pg_type where typname = 'import_source') then
    create type public.import_source as enum ('OCR', 'MANUAL');
  end if;
  if not exists (select 1 from pg_type where typname = 'import_status') then
    create type public.import_status as enum ('DRAFT', 'REVIEWING', 'COMMITTED', 'REJECTED');
  end if;
end
$$;

-- --- updated_at trigger helper ----------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- --- profiles (1-1 với auth.users) ------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null unique references auth.users (id) on delete cascade,
  role          public.user_role not null default 'PARENT',
  full_name     text not null,
  phone         text,
  email         text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- --- neighborhoods (trục phân quyền lõi) ------------------------------------
create table if not exists public.neighborhoods (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- --- secretary_neighborhoods (gán Bí thư ↔ nhiều Khu phố) -------------------
create table if not exists public.secretary_neighborhoods (
  id               uuid primary key default gen_random_uuid(),
  secretary_id     uuid not null references public.profiles (id) on delete cascade,
  neighborhood_id  uuid not null references public.neighborhoods (id) on delete cascade,
  created_at       timestamptz not null default now(),
  unique (secretary_id, neighborhood_id)
);

-- --- guardians (phụ huynh; có thể gắn 1 profile để đăng nhập) ---------------
create table if not exists public.guardians (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references public.profiles (id) on delete set null,
  full_name   text not null,
  phone       text,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- --- students (neighborhood_id BẮT BUỘC; soft delete) -----------------------
create table if not exists public.students (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  birth_year       int check (birth_year is null or birth_year between 1990 and 2100),
  neighborhood_id  uuid not null references public.neighborhoods (id) on delete restrict,
  active           boolean not null default true,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table if not exists public.student_guardians (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students (id) on delete cascade,
  guardian_id   uuid not null references public.guardians (id) on delete cascade,
  relationship  text,
  unique (student_id, guardian_id)
);

-- --- activity_sessions (REGULAR/JOINT; soft delete) -------------------------
create table if not exists public.activity_sessions (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  session_date  date not null,
  start_time    time,
  session_type  public.session_type not null default 'REGULAR',
  location      text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table if not exists public.session_neighborhoods (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.activity_sessions (id) on delete cascade,
  neighborhood_id  uuid not null references public.neighborhoods (id) on delete cascade,
  unique (session_id, neighborhood_id)
);

-- Grant quyền điểm danh đặc biệt cho Bí thư theo buổi (đặc biệt buổi chung)
create table if not exists public.session_permissions (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.activity_sessions (id) on delete cascade,
  secretary_id  uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (session_id, secretary_id)
);

-- --- attendance_records ------------------------------------------------------
create table if not exists public.attendance_records (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.activity_sessions (id) on delete cascade,
  student_id  uuid not null references public.students (id) on delete cascade,
  status      public.attendance_status not null,
  marked_by   uuid references public.profiles (id) on delete set null,
  marked_at   timestamptz not null default now(),
  note        text,
  unique (session_id, student_id)
);

-- --- leave_requests ----------------------------------------------------------
create table if not exists public.leave_requests (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students (id) on delete cascade,
  session_id    uuid references public.activity_sessions (id) on delete set null,
  reason        text,
  status        public.leave_status not null default 'SUBMITTED',
  submitted_by  uuid references public.profiles (id) on delete set null,
  handled_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- --- notifications / recipients ---------------------------------------------
create table if not exists public.notifications (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  body             text,
  scope            public.notification_scope not null,
  neighborhood_id  uuid references public.neighborhoods (id) on delete cascade,
  session_id       uuid references public.activity_sessions (id) on delete cascade,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now()
);

create table if not exists public.notification_recipients (
  id               uuid primary key default gen_random_uuid(),
  notification_id  uuid not null references public.notifications (id) on delete cascade,
  profile_id       uuid not null references public.profiles (id) on delete cascade,
  read_at          timestamptz,
  unique (notification_id, profile_id)
);

-- --- uploaded_documents (metadata file — bucket không public) ---------------
create table if not exists public.uploaded_documents (
  id           uuid primary key default gen_random_uuid(),
  bucket       text not null,
  path         text not null,
  mime_type    text,
  size_bytes   bigint,
  sha256       text,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- --- import staging ----------------------------------------------------------
create table if not exists public.import_batches (
  id               uuid primary key default gen_random_uuid(),
  file_name        text not null,
  source           public.import_source not null default 'MANUAL',
  status           public.import_status not null default 'DRAFT',
  neighborhood_id  uuid references public.neighborhoods (id) on delete set null,
  document_id      uuid references public.uploaded_documents (id) on delete set null,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.import_batch_rows (
  id                  uuid primary key default gen_random_uuid(),
  batch_id            uuid not null references public.import_batches (id) on delete cascade,
  raw_data            jsonb not null default '{}'::jsonb,
  reviewed            boolean not null default false,
  created_student_id  uuid references public.students (id) on delete set null,
  created_at          timestamptz not null default now()
);

-- --- export_templates (DOCX an toàn) ----------------------------------------
create table if not exists public.export_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  document_id  uuid references public.uploaded_documents (id) on delete set null,
  active       boolean not null default true,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- --- audit_logs (append-only — không policy update/delete) ------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  actor_role  public.user_role,
  action      text not null,
  entity      text,
  detail      text,
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- --- system_settings (single row; chỉ field whitelist) ----------------------
create table if not exists public.system_settings (
  id                 boolean primary key default true,
  system_name        text not null default 'Điểm danh sinh hoạt hè',
  primary_color      text,
  logo_document_id   uuid references public.uploaded_documents (id) on delete set null,
  public_footer_text text,
  updated_by         uuid references public.profiles (id) on delete set null,
  updated_at         timestamptz not null default now(),
  constraint system_settings_singleton check (id = true)
);

-- --- Indexes (FK/lookup nóng) -----------------------------------------------
create index if not exists idx_profiles_role                 on public.profiles (role);
create index if not exists idx_secretary_neigh_secretary     on public.secretary_neighborhoods (secretary_id);
create index if not exists idx_secretary_neigh_neighborhood  on public.secretary_neighborhoods (neighborhood_id);
create index if not exists idx_guardians_profile             on public.guardians (profile_id);
create index if not exists idx_students_neighborhood         on public.students (neighborhood_id);
create index if not exists idx_student_guardians_student     on public.student_guardians (student_id);
create index if not exists idx_student_guardians_guardian    on public.student_guardians (guardian_id);
create index if not exists idx_session_neigh_session         on public.session_neighborhoods (session_id);
create index if not exists idx_session_neigh_neighborhood    on public.session_neighborhoods (neighborhood_id);
create index if not exists idx_session_perm_session          on public.session_permissions (session_id);
create index if not exists idx_attendance_session            on public.attendance_records (session_id);
create index if not exists idx_attendance_student            on public.attendance_records (student_id);
create index if not exists idx_leave_student                 on public.leave_requests (student_id);
create index if not exists idx_notif_recipients_profile      on public.notification_recipients (profile_id);
create index if not exists idx_import_rows_batch             on public.import_batch_rows (batch_id);

-- --- updated_at triggers -----------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'profiles', 'neighborhoods', 'guardians', 'students',
    'activity_sessions', 'leave_requests', 'import_batches', 'export_templates'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end
$$;

-- --- Grants (RLS vẫn kiểm soát dòng; đây chỉ là quyền cấp bảng) --------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
-- anon KHÔNG được cấp quyền bảng — mọi truy cập ẩn danh bị chặn (deny-by-default).
