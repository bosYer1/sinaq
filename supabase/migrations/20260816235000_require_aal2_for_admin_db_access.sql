-- Defense in depth: database-side admin authorization must require MFA as well.
-- Server actions and the /admin proxy already require AAL2; this closes direct
-- PostgREST/RPC/RLS access using an admin account that has only completed AAL1.

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    coalesce((select auth.jwt()->>'aal') = 'aal2', false)
    and exists (
      select 1
      from public.admin_users
      where user_id = (select auth.uid())
    );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
