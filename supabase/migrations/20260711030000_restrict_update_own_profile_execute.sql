-- Prompt 10B review hardening — SECURITY DEFINER RPC chỉ nên gọi bởi authenticated.
-- Function tự no-op khi auth.uid() null, nhưng revoke public/anon để tránh bề mặt RPC không cần thiết.
-- KHÔNG đổi RLS, KHÔNG drop table/policy, KHÔNG using(true).

revoke all on function public.update_own_profile(text, text) from public;
revoke all on function public.update_own_profile(text, text) from anon;
grant execute on function public.update_own_profile(text, text) to authenticated;
