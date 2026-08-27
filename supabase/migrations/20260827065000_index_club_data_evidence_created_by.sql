create index if not exists idx_club_data_evidence_created_by
  on public.club_data_evidence (created_by)
  where created_by is not null;
