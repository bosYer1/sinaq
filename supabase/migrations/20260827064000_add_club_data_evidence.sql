create table if not exists public.club_data_evidence (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  field_name text not null check (
    field_name in (
      'name',
      'address',
      'coordinates',
      'phone',
      'instagram',
      'hours',
      'pricing',
      'description',
      'image',
      'type',
      'status'
    )
  ),
  source_type text not null check (
    source_type in (
      'official_instagram',
      'official_website',
      'owner_submission',
      'map_listing',
      'business_directory',
      'social_mirror',
      'other'
    )
  ),
  source_url text not null check (
    char_length(source_url) between 8 and 1000
    and source_url ~ '^https://'
  ),
  evidence_value text null check (
    evidence_value is null or char_length(evidence_value) <= 3000
  ),
  confidence text not null check (
    confidence in ('official', 'corroborated', 'single_secondary', 'conflicted')
  ),
  is_current boolean not null default true,
  checked_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.club_data_evidence enable row level security;

revoke all on table public.club_data_evidence from anon, authenticated;
grant select, insert, update, delete on table public.club_data_evidence to authenticated;

create policy admin_read_club_data_evidence
on public.club_data_evidence
for select
to authenticated
using (is_admin());

create policy admin_insert_club_data_evidence
on public.club_data_evidence
for insert
to authenticated
with check (is_admin());

create policy admin_update_club_data_evidence
on public.club_data_evidence
for update
to authenticated
using (is_admin())
with check (is_admin());

create policy admin_delete_club_data_evidence
on public.club_data_evidence
for delete
to authenticated
using (is_admin());

create index if not exists idx_club_data_evidence_club_field_checked
  on public.club_data_evidence (club_id, field_name, checked_at desc);

create index if not exists idx_club_data_evidence_current
  on public.club_data_evidence (club_id, is_current, checked_at desc)
  where is_current = true;

create unique index if not exists uq_club_data_evidence_current_source
  on public.club_data_evidence (club_id, field_name, source_url)
  where is_current = true;
