create or replace function public.verify_owner_claim_atomic(p_submission_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_club_id uuid;
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select club_id, status
  into v_club_id, v_status
  from public.club_submissions
  where id = p_submission_id
    and kind = 'owner_claim'
  for update;

  if v_club_id is null then
    raise exception 'Owner claim or linked club not found';
  end if;

  if v_status in ('resolved', 'rejected') then
    raise exception 'Completed owner claim cannot be verified';
  end if;

  if not exists (
    select 1 from public.clubs
    where id = v_club_id and is_active = true
  ) then
    raise exception 'Linked club is not active';
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
