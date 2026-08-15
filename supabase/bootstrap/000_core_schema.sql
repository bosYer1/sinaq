-- GameYer core schema bootstrap
--
-- This file reconstructs the manually-created schema that existed before the
-- first recorded Supabase migration (20260813061645). It is intentionally kept
-- OUTSIDE supabase/migrations so it is never replayed against production.
-- Use it only when provisioning a completely empty Supabase project, then run
-- the versioned migrations in supabase/migrations in order.

create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.club_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  district_id uuid not null references public.districts(id) on delete restrict,
  address text not null,
  latitude numeric,
  longitude numeric,
  phone text,
  instagram_url text,
  rating_avg numeric,
  rating_count integer not null default 0,
  is_premium boolean not null default false,
  premium_expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_pricing (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  club_type_id uuid not null references public.club_types(id) on delete restrict,
  price_from numeric not null,
  price_to numeric,
  unit text not null default 'saat',
  constraint uq_club_pricing_club_type unique (club_id, club_type_id)
);

create table if not exists public.club_opening_hours (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  day_of_week smallint not null,
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  constraint chk_day_of_week_range check (day_of_week >= 0 and day_of_week <= 6),
  constraint uq_club_opening_hours_club_day unique (club_id, day_of_week)
);

create table if not exists public.club_images (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  url text not null,
  position integer not null default 0,
  is_cover boolean not null default false
);

create index if not exists idx_clubs_district_id on public.clubs (district_id);
create index if not exists idx_clubs_is_active on public.clubs (is_active);
create index if not exists idx_clubs_lat_lng on public.clubs (latitude, longitude);
create index if not exists idx_club_pricing_club_id on public.club_pricing (club_id);
create index if not exists idx_club_opening_hours_club_id on public.club_opening_hours (club_id);
create index if not exists idx_club_images_club_id on public.club_images (club_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clubs_updated_at on public.clubs;
create trigger trg_clubs_updated_at
before update on public.clubs
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'club-images',
  'club-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
