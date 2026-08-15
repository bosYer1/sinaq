create table if not exists public.club_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('correction', 'new_club', 'owner_claim')),
  club_id uuid null references public.clubs(id) on delete set null,
  club_name text not null check (char_length(club_name) between 2 and 120),
  message text not null check (char_length(message) between 10 and 3000),
  contact_type text not null check (contact_type in ('instagram', 'phone', 'email')),
  contact_value text not null check (char_length(contact_value) between 3 and 200),
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null
);

alter table public.club_submissions enable row level security;

revoke all on table public.club_submissions from anon, authenticated;
grant insert on table public.club_submissions to anon, authenticated;
grant select, update, delete on table public.club_submissions to authenticated;

create policy anon_insert_club_submissions
on public.club_submissions
for insert
to anon
with check (status = 'pending' and reviewed_at is null);

create policy authenticated_insert_club_submissions
on public.club_submissions
for insert
to authenticated
with check (status = 'pending' and reviewed_at is null);

create policy admin_read_club_submissions
on public.club_submissions
for select
to authenticated
using (is_admin());

create policy admin_update_club_submissions
on public.club_submissions
for update
to authenticated
using (is_admin())
with check (is_admin());

create policy admin_delete_club_submissions
on public.club_submissions
for delete
to authenticated
using (is_admin());

create index if not exists idx_club_submissions_status_created_at
  on public.club_submissions (status, created_at desc);
create index if not exists idx_club_submissions_club_id
  on public.club_submissions (club_id)
  where club_id is not null;
