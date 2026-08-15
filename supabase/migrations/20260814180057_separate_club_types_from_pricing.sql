create table if not exists public.club_type_assignments (
  club_id uuid not null references public.clubs(id) on delete cascade,
  club_type_id uuid not null references public.club_types(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (club_id, club_type_id)
);

alter table public.club_type_assignments enable row level security;

drop policy if exists public_read_club_type_assignments on public.club_type_assignments;
create policy public_read_club_type_assignments
on public.club_type_assignments
for select
to anon, authenticated
using (true);

drop policy if exists admin_write_club_type_assignments on public.club_type_assignments;
create policy admin_write_club_type_assignments
on public.club_type_assignments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.club_type_assignments (club_id, club_type_id)
select distinct club_id, club_type_id
from public.club_pricing
on conflict do nothing;

delete from public.club_pricing where price_from = 0;