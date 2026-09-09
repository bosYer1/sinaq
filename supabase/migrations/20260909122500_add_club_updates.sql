create table if not exists public.club_updates (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  kind text not null check (kind in ('tournament', 'offer')),
  title text not null check (char_length(title) between 2 and 120),
  description text null check (
    description is null or char_length(description) <= 1500
  ),
  starts_at timestamptz null,
  ends_at timestamptz not null,
  source_type text not null check (
    source_type in (
      'official_instagram',
      'official_website',
      'owner_submission',
      'other'
    )
  ),
  source_url text not null check (
    char_length(source_url) between 8 and 1000
    and source_url ~ '^https://'
  ),
  verified_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_by uuid null references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at is null or ends_at > starts_at)
);

alter table public.club_updates enable row level security;

revoke all on table public.club_updates from anon, authenticated;
grant select on table public.club_updates to anon, authenticated;
grant insert, update, delete on table public.club_updates to authenticated;

create policy public_read_active_club_updates
on public.club_updates
for select
to anon, authenticated
using (
  is_active = true
  and ends_at > now()
  and exists (
    select 1
    from public.clubs
    where clubs.id = club_updates.club_id
      and clubs.is_active = true
  )
);

create policy admin_read_all_club_updates
on public.club_updates
for select
to authenticated
using (is_admin());

create policy admin_insert_club_updates
on public.club_updates
for insert
to authenticated
with check (is_admin());

create policy admin_update_club_updates
on public.club_updates
for update
to authenticated
using (is_admin())
with check (is_admin());

create policy admin_delete_club_updates
on public.club_updates
for delete
to authenticated
using (is_admin());

create index if not exists idx_club_updates_active_expiry
  on public.club_updates (is_active, ends_at)
  where is_active = true;

create index if not exists idx_club_updates_club_kind_expiry
  on public.club_updates (club_id, kind, ends_at desc)
  where is_active = true;

create unique index if not exists uq_club_updates_active_source
  on public.club_updates (club_id, kind, source_url)
  where is_active = true;
