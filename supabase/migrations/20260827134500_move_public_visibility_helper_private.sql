-- Keep the SECURITY DEFINER eligibility helper out of PostgREST's exposed public schema.
-- Policies may execute it, but clients cannot call it as a public RPC endpoint.

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

create or replace function app_private.is_public_club(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.clubs c
    where c.id = p_club_id
      and c.is_active = true
      and c.instagram_url is not null
      and btrim(c.instagram_url) <> ''
      and c.latitude is not null
      and c.longitude is not null
      and exists (
        select 1
        from public.club_type_assignments cta
        join public.club_types ct on ct.id = cta.club_type_id
        where cta.club_id = c.id
          and ct.slug in ('pc', 'playstation')
      )
  );
$$;

revoke all on function app_private.is_public_club(uuid) from public;
grant execute on function app_private.is_public_club(uuid) to anon, authenticated;

alter policy public_read_visible_clubs_anon on public.clubs
using (app_private.is_public_club(id));

alter policy authenticated_read_visible_or_admin_clubs on public.clubs
using (public.is_admin() or app_private.is_public_club(id));

alter policy anon_read_visible_club_images on public.club_images
using (app_private.is_public_club(club_id));

alter policy authenticated_read_visible_or_admin_club_images on public.club_images
using (public.is_admin() or app_private.is_public_club(club_id));

alter policy anon_read_visible_club_opening_hours on public.club_opening_hours
using (app_private.is_public_club(club_id));

alter policy authenticated_read_visible_or_admin_club_opening_hours on public.club_opening_hours
using (public.is_admin() or app_private.is_public_club(club_id));

alter policy anon_read_visible_club_pricing on public.club_pricing
using (app_private.is_public_club(club_id));

alter policy authenticated_read_visible_or_admin_club_pricing on public.club_pricing
using (public.is_admin() or app_private.is_public_club(club_id));

alter policy anon_read_visible_club_type_assignments on public.club_type_assignments
using (app_private.is_public_club(club_id));

alter policy authenticated_read_visible_or_admin_club_type_assignments on public.club_type_assignments
using (public.is_admin() or app_private.is_public_club(club_id));

drop function if exists public.is_public_club(uuid);
