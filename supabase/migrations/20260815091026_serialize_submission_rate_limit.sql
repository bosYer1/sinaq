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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.contact_type || ':' || normalized_contact, 0)
  );

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

revoke all on function public.enforce_club_submission_rate_limit() from public, anon, authenticated;