-- September founder-absence hardening.
-- Keep public club-update visibility unchanged while avoiding duplicate permissive SELECT policies.

create index if not exists idx_admin_notifications_submission_id
  on public.admin_notifications (submission_id)
  where submission_id is not null;

create index if not exists idx_club_updates_created_by
  on public.club_updates (created_by)
  where created_by is not null;

-- Production history created two identical partial indexes. Keep the explicitly named *_at variant.
drop index if exists public.admin_notifications_unread_created_idx;

-- One SELECT policy per role/action avoids evaluating two permissive policies for authenticated users.
drop policy if exists public_read_active_club_updates on public.club_updates;
drop policy if exists admin_read_all_club_updates on public.club_updates;

create policy anon_read_active_club_updates
on public.club_updates
for select
to anon
using (
  is_active = true
  and (
    ends_at > now()
    or (kind = 'offer' and ends_at is null and reverify_after > now())
  )
  and exists (
    select 1
    from public.clubs
    where clubs.id = club_updates.club_id
      and clubs.is_active = true
  )
);

create policy authenticated_read_club_updates
on public.club_updates
for select
to authenticated
using (
  is_admin()
  or (
    is_active = true
    and (
      ends_at > now()
      or (kind = 'offer' and ends_at is null and reverify_after > now())
    )
    and exists (
      select 1
      from public.clubs
      where clubs.id = club_updates.club_id
        and clubs.is_active = true
    )
  )
);