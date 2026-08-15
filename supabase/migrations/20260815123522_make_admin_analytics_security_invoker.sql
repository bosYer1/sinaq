alter function public.get_admin_analytics() security invoker;
revoke all on function public.get_admin_analytics() from public, anon;
grant execute on function public.get_admin_analytics() to authenticated;
