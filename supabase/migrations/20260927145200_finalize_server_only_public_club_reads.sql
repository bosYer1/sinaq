-- Final production cutover for GameYer public club inventory.
-- Apply only after trusted Vercel/GitHub OIDC reads are deployed and verified.
-- Idempotent: removes anonymous bulk-read paths only; authenticated admin
-- SELECT policies remain untouched.

revoke select on table public.clubs from anon;
drop policy if exists public_read_visible_clubs_anon on public.clubs;

revoke select on table public.club_pricing from anon;
drop policy if exists anon_read_visible_club_pricing on public.club_pricing;

revoke select on table public.club_opening_hours from anon;
drop policy if exists anon_read_visible_club_opening_hours on public.club_opening_hours;

revoke select on table public.club_images from anon;
drop policy if exists anon_read_visible_club_images on public.club_images;

revoke select on table public.club_type_assignments from anon;
drop policy if exists anon_read_visible_club_type_assignments on public.club_type_assignments;

revoke select on table public.club_types from anon;
drop policy if exists public_read_club_types on public.club_types;

revoke select on table public.districts from anon;
drop policy if exists public_read_districts on public.districts;

revoke select on table public.club_updates from anon;
drop policy if exists anon_read_active_club_updates on public.club_updates;

revoke execute on function app_private.is_public_club(uuid) from anon, authenticated;
