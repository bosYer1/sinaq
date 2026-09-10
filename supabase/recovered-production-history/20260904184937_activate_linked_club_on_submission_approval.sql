create or replace function private.activate_linked_club_on_submission_approval()
returns trigger
language plpgsql
set search_path = 'pg_catalog', 'public'
as $function$
begin
  if new.status = 'resolved'
     and old.status is distinct from new.status
     and new.club_id is not null
     and new.kind in ('new_club', 'owner_claim') then
    update public.clubs
    set is_active = true,
        updated_at = now()
    where id = new.club_id
      and is_active is distinct from true;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_activate_linked_club_on_submission_approval on public.club_submissions;
create trigger trg_activate_linked_club_on_submission_approval
after update of status on public.club_submissions
for each row
execute function private.activate_linked_club_on_submission_approval();

create or replace function public.verify_owner_claim_atomic(p_submission_id uuid)
returns uuid
language plpgsql
set search_path to 'public'
as $function$
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
    where id = v_club_id
  ) then
    raise exception 'Linked club not found';
  end if;

  update public.clubs
  set
    is_active = true,
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
$function$;
