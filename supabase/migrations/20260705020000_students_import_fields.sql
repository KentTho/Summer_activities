-- Prompt 06A — Bổ sung trường cho CRUD học sinh + import staging.
-- Chỉ THÊM cột (additive), idempotent. KHÔNG drop, KHÔNG đổi RLS.
-- Các policy students hiện có áp cho toàn bộ cột nên không cần policy mới.
--
-- Trường quan trọng khi import (theo yêu cầu nghiệp vụ):
--   full_name (đã có) · birth_date · guardian_phone.
-- guardian_name/school là thông tin phụ, có thể điền sau.

alter table public.students add column if not exists birth_date date;
alter table public.students add column if not exists school text;
alter table public.students add column if not exists guardian_name text;
alter table public.students add column if not exists guardian_phone text;

-- Index hỗ trợ lọc theo trường học trong phạm vi Khu phố.
create index if not exists idx_students_school on public.students (school);
