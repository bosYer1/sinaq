-- Add first-class TikTok support for club profiles.
-- Public eligibility accepts at least one verified social profile: Instagram or TikTok.

alter table public.clubs
  add column if not exists tiktok_url text;

alter table public.clubs
  drop constraint if exists chk_clubs_tiktok_url;

alter table public.clubs
  add constraint chk_clubs_tiktok_url
  check (
    tiktok_url is null
    or tiktok_url ~* '^https://(www\.)?tiktok\.com/@[a-z0-9._]{2,24}/?(\?.*)?$'
  );

alter table public.clubs
  drop constraint if exists chk_active_clubs_require_instagram;

alter table public.clubs
  drop constraint if exists chk_active_clubs_require_social;

alter table public.clubs
  add constraint chk_active_clubs_require_social
  check (
    not is_active
    or instagram_url is not null
    or tiktok_url is not null
  );

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
      and (
        (c.instagram_url is not null and btrim(c.instagram_url) <> '')
        or (c.tiktok_url is not null and btrim(c.tiktok_url) <> '')
      )
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


-- Founder-authorized Sigma Gamer Arena activation using its verified TikTok profile.
update public.clubs
set tiktok_url = 'https://www.tiktok.com/@sigmagamersarenavip',
    is_active = true,
    updated_at = now()
where slug = 'sigma-gamer-arena';
