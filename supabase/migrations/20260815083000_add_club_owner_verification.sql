alter table public.clubs
  add column if not exists is_verified boolean not null default false,
  add column if not exists verified_at timestamptz null;

alter table public.clubs
  drop constraint if exists clubs_verified_state_check;

alter table public.clubs
  add constraint clubs_verified_state_check
  check (
    (is_verified = true and verified_at is not null)
    or (is_verified = false and verified_at is null)
  );

create or replace function public.verify_owner_claim_atomic(p_submission_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_club_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select club_id
  into v_club_id
  from public.club_submissions
  where id = p_submission_id
    and kind = 'owner_claim'
  for update;

  if v_club_id is null then
    raise exception 'Owner claim or linked club not found';
  end if;

  update public.clubs
  set
    is_verified = true,
    verified_at = now(),
    updated_at = now()
  where id = v_club_id;

  update public.club_submissions
  set
    status = 'resolved',
    reviewed_at = now()
  where id = p_submission_id;

  return v_club_id;
end;
$$;

revoke all on function public.verify_owner_claim_atomic(uuid) from public, anon;
grant execute on function public.verify_owner_claim_atomic(uuid) to authenticated;
