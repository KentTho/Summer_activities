-- =============================================================================
-- 08A · Sửa ĐỆ QUY RLS giữa notifications ↔ notification_recipients (lỗi 42P17)
-- Nguyên nhân: notif_select có subquery đọc notification_recipients (chịu nr_select),
-- mà nr_select lại có subquery đọc notifications (chịu notif_select) → đệ quy vô hạn.
-- Cách sửa: helper SECURITY DEFINER (bỏ qua RLS nội bộ) — CÙNG logic, hết đệ quy.
-- ADDITIVE/corrective: KHÔNG nới quyền, KHÔNG using(true), KHÔNG disable RLS.
-- =============================================================================

create or replace function public.is_notification_recipient(target_notification uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.notification_recipients nr
    where nr.notification_id = target_notification
      and nr.profile_id = public.current_profile_id()
  );
$$;

create or replace function public.is_notification_creator(target_notification uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.notifications n
    where n.id = target_notification
      and n.created_by = public.current_profile_id()
  );
$$;

grant execute on function public.is_notification_recipient(uuid) to anon, authenticated;
grant execute on function public.is_notification_creator(uuid) to anon, authenticated;

-- notifications: người nhận thấy qua helper (không tham chiếu trực tiếp bảng kia).
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications for select to authenticated
  using (
    public.is_admin()
    or created_by = public.current_profile_id()
    or public.is_notification_recipient(id)
  );

-- notification_recipients: người tạo thông báo thấy danh sách người nhận qua helper.
drop policy if exists nr_select on public.notification_recipients;
create policy nr_select on public.notification_recipients for select to authenticated
  using (
    public.is_admin()
    or profile_id = public.current_profile_id()
    or public.is_notification_creator(notification_id)
  );
