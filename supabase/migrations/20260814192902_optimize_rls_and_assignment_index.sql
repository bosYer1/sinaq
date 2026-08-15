-- Avoid per-row auth.uid() re-evaluation on admin_users
alter policy admin_users_self_read on public.admin_users
using ((select auth.uid()) = user_id);

-- Add covering index for FK used by club-type filtering
create index if not exists idx_club_type_assignments_club_type_id
  on public.club_type_assignments (club_type_id);

-- Replace overlapping ALL + public SELECT policies with one SELECT policy per role
-- clubs: anonymous users only see active rows; signed-in admins may also see inactive rows.
drop policy if exists admin_write_clubs on public.clubs;
drop policy if exists public_read_active_clubs on public.clubs;
create policy public_read_active_clubs_anon on public.clubs
  for select to anon using (is_active = true);
create policy authenticated_read_clubs on public.clubs
  for select to authenticated using (is_active = true or is_admin());
create policy admin_insert_clubs on public.clubs
  for insert to authenticated with check (is_admin());
create policy admin_update_clubs on public.clubs
  for update to authenticated using (is_admin()) with check (is_admin());
create policy admin_delete_clubs on public.clubs
  for delete to authenticated using (is_admin());

-- Public lookup/child tables: both anon and authenticated can read; only admins write.
do $$
declare t text;
begin
  foreach t in array array['districts','club_types','club_pricing','club_opening_hours','club_images','club_type_assignments']
  loop
    execute format('drop policy if exists admin_write_%I on public.%I', t, t);
    execute format('drop policy if exists public_read_%I on public.%I', t, t);
    execute format('create policy public_read_%I on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy admin_insert_%I on public.%I for insert to authenticated with check (is_admin())', t, t);
    execute format('create policy admin_update_%I on public.%I for update to authenticated using (is_admin()) with check (is_admin())', t, t);
    execute format('create policy admin_delete_%I on public.%I for delete to authenticated using (is_admin())', t, t);
  end loop;
end $$;