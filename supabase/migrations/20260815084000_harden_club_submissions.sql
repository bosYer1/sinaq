create or replace function public.enforce_club_submission_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
  normalized_contact text;
begin
  normalized_contact := case
    when new.contact_type = 'phone'
      then regexp_replace(new.contact_value, '[^0-9+]', '', 'g')
    else lower(new.contact_value)
  end;

  select count(*)
  into recent_count
  from public.club_submissions
  where contact_type = new.contact_type
    and (
      case
        when contact_type = 'phone'
          then regexp_replace(contact_value, '[^0-9+]', '', 'g')
        else lower(contact_value)
      end
    ) = normalized_contact
    and created_at >= now() - interval '15 minutes';

  if recent_count >= 3 then
    raise exception 'Submission rate limit exceeded';
  end if;

  return new;
end;
$$;

drop trigger if exists club_submissions_rate_limit on public.club_submissions;
create trigger club_submissions_rate_limit
before insert on public.club_submissions
for each row
execute function public.enforce_club_submission_rate_limit();

revoke all on function public.enforce_club_submission_rate_limit() from public, anon, authenticated;
