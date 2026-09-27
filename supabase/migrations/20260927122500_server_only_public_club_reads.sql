-- GameYer public club inventory must be rendered server-side.
-- This removes the browser publishable-key bulk-read path while preserving
-- authenticated admin reads and trusted Vercel OIDC -> Supabase Edge reads.
--
-- IMPORTANT: deploy the OIDC read proxy and application code that uses
-- createServerDataClient in the same controlled release as this migration.
-- Do not apply this migration by itself.

revoke select on table public.clubs from anon;
drop policy if exists public_read_visible_clubs_anon on public.clubs;
drop policy if exists authenticated_read_visible_or_admin_clubs on public.clubs;
create policy authenticated_admin_read_clubs
on public.clubs
for select
to authenticated
using ((select public.is_admin()));

revoke select on table public.club_pricing from anon;
drop policy if exists anon_read_visible_club_pricing on public.club_pricing;
drop policy if exists authenticated_read_visible_or_admin_club_pricing on public.club_pricing;
create policy authenticated_admin_read_club_pricing
on public.club_pricing
for select
to authenticated
using ((select public.is_admin()));

revoke select on table public.club_opening_hours from anon;
drop policy if exists anon_read_visible_club_opening_hours on public.club_opening_hours;
drop policy if exists authenticated_read_visible_or_admin_club_opening_hours on public.club_opening_hours;
create policy authenticated_admin_read_club_opening_hours
on public.club_opening_hours
for select
to authenticated
using ((select public.is_admin()));

revoke select on table public.club_images from anon;
drop policy if exists anon_read_visible_club_images on public.club_images;
drop policy if exists authenticated_read_visible_or_admin_club_images on public.club_images;
create policy authenticated_admin_read_club_images
on public.club_images
for select
to authenticated
using ((select public.is_admin()));

revoke select on table public.club_type_assignments from anon;
drop policy if exists anon_read_visible_club_type_assignments on public.club_type_assignments;
drop policy if exists authenticated_read_visible_or_admin_club_type_assignments on public.club_type_assignments;
create policy authenticated_admin_read_club_type_assignments
on public.club_type_assignments
for select
to authenticated
using ((select public.is_admin()));

revoke select on table public.club_types from anon;
drop policy if exists public_read_club_types on public.club_types;
create policy authenticated_admin_read_club_types
on public.club_types
for select
to authenticated
using ((select public.is_admin()));

revoke select on table public.districts from anon;
drop policy if exists public_read_districts on public.districts;
create policy authenticated_admin_read_districts
on public.districts
for select
to authenticated
using ((select public.is_admin()));

revoke select on table public.club_updates from anon;
drop policy if exists anon_read_active_club_updates on public.club_updates;
drop policy if exists authenticated_read_club_updates on public.club_updates;
create policy authenticated_admin_read_club_updates
on public.club_updates
for select
to authenticated
using ((select public.is_admin()));

-- The legacy visibility helper was exposed to anon/authenticated only to support
-- the public RLS policies removed above. Once public inventory reads move
-- server-side, callers must not be able to probe club UUID visibility through RPC.
revoke execute on function app_private.is_public_club(uuid) from anon, authenticated;

