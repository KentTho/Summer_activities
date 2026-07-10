-- Prompt 10B — Cho user tự cập nhật thông tin cá nhân AN TOÀN (ADDITIVE).
-- profiles_update hiện chỉ cho ADMIN (using is_admin()). KHÔNG nới policy đó (tránh
-- user tự đổi role/active/staff_title). Thay vào đó dùng RPC SECURITY DEFINER chỉ sửa
-- ĐÚNG các cột an toàn (full_name, phone) của CHÍNH người đăng nhập.
-- KHÔNG cho đổi role/active/staff_title/neighborhood. KHÔNG disable RLS, KHÔNG using(true).

create or replace function public.update_own_profile(p_full_name text, p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pid uuid := public.current_profile_id();
  v_name text := btrim(coalesce(p_full_name, ''));
  v_phone text := btrim(coalesce(p_phone, ''));
begin
  if v_pid is null then
    return;
  end if;
  if length(v_name) > 120 or length(v_phone) > 20 then
    raise exception 'Giá trị quá dài';
  end if;
  -- Chỉ đổi họ tên/điện thoại; giữ nguyên role/active/staff_title/email/neighborhood.
  update public.profiles
     set full_name = coalesce(nullif(v_name, ''), full_name),
         phone = nullif(v_phone, '')
   where id = v_pid;
end;
$$;

grant execute on function public.update_own_profile(text, text) to authenticated;
