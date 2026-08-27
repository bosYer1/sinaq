-- Keep hidden-but-retained club data private from anonymous Supabase clients.
-- Public eligibility must match the website/sitemap contract:
-- active + Instagram + complete coordinates + confirmed PC/PlayStation type.

create or replace function public.is_public_club(p_club_id uuid)
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

revoke all on function public.is_public_club(uuid) from public;
grant execute on function public.is_public_club(uuid) to anon, authenticated;

drop policy if exists public_read_active_clubs_anon on public.clubs;
create policy public_read_visible_clubs_anon
on public.clubs
for select
to anon
using (public.is_public_club(id));

drop policy if exists anon_read_active_club_images on public.club_images;
create policy anon_read_visible_club_images
on public.club_images
for select
to anon
using (public.is_public_club(club_id));

drop policy if exists anon_read_active_club_opening_hours on public.club_opening_hours;
create policy anon_read_visible_club_opening_hours
on public.club_opening_hours
for select
to anon
using (public.is_public_club(club_id));

drop policy if exists anon_read_active_club_pricing on public.club_pricing;
create policy anon_read_visible_club_pricing
on public.club_pricing
for select
to anon
using (public.is_public_club(club_id));

drop policy if exists anon_read_active_club_type_assignments on public.club_type_assignments;
create policy anon_read_visible_club_type_assignments
on public.club_type_assignments
for select
to anon
using (public.is_public_club(club_id));
