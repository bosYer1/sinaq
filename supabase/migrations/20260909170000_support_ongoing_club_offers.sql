alter table public.club_updates
  alter column ends_at drop not null;

alter table public.club_updates
  add column if not exists reverify_after timestamptz null;

alter table public.club_updates
  drop constraint if exists club_updates_starts_at_check;

alter table public.club_updates
  add constraint club_updates_starts_at_check
  check (starts_at is null or ends_at is null or ends_at > starts_at);

alter table public.club_updates
  add constraint club_updates_validity_check
  check (
    (kind = 'tournament' and ends_at is not null)
    or (
      kind = 'offer'
      and (
        ends_at is not null
        or reverify_after is not null
      )
    )
  );

alter table public.club_updates
  add constraint club_updates_reverify_after_check
  check (
    reverify_after is null
    or (
      reverify_after > verified_at
      and reverify_after <= verified_at + interval '7 days'
    )
  );

drop policy if exists public_read_active_club_updates on public.club_updates;

create policy public_read_active_club_updates
on public.club_updates
for select
to anon, authenticated
using (
  is_active = true
  and (
    (ends_at is not null and ends_at > now())
    or (
      kind = 'offer'
      and ends_at is null
      and reverify_after is not null
      and reverify_after > now()
    )
  )
  and exists (
    select 1
    from public.clubs
    where clubs.id = club_updates.club_id
      and clubs.is_active = true
  )
);

create index if not exists idx_club_updates_active_reverify
  on public.club_updates (is_active, reverify_after)
  where is_active = true and kind = 'offer' and ends_at is null;
