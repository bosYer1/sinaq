-- Harden public write surfaces against direct REST abuse while preserving the
-- current anonymous submission/analytics flows.
-- Core submission CHECK constraints are created by earlier production migrations;
-- this migration adds the abuse-resistant DB backstops only.

-- These indexes make the security circuit-breakers cheap even while traffic spikes.
create index if not exists idx_club_submissions_created_at
  on public.club_submissions (created_at desc);

create index if not exists idx_analytics_events_session_created_at
  on public.analytics_events (session_id, created_at desc);

create or replace function public.enforce_club_submission_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  recent_contact_count integer;
  recent_global_count integer;
  normalized_contact text;
begin
  normalized_contact := case
    when new.contact_type = 'phone'
      then regexp_replace(new.contact_value, '[^0-9+]', '', 'g')
    else lower(btrim(new.contact_value))
  end;

  if new.status <> 'pending' or new.reviewed_at is not null then
    raise exception 'Invalid public submission state';
  end if;

  if new.contact_type = 'email' and new.contact_value !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid contact';
  elsif new.contact_type = 'phone' and new.contact_value !~ '^\+?[0-9 ()-]{7,24}$' then
    raise exception 'Invalid contact';
  elsif new.contact_type = 'instagram' and new.contact_value !~* '^(@?[a-z0-9._]{1,30}|https://(www\.)?instagram\.com/[a-z0-9._]+/?(\?.*)?)$' then
    raise exception 'Invalid contact';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.contact_type || ':' || normalized_contact, 0)
  );

  select count(*) into recent_contact_count
  from public.club_submissions
  where contact_type = new.contact_type
    and (case when contact_type = 'phone'
      then regexp_replace(contact_value, '[^0-9+]', '', 'g')
      else lower(btrim(contact_value)) end) = normalized_contact
    and created_at >= now() - interval '15 minutes';

  if recent_contact_count >= 3 then
    raise exception 'Submission rate limit exceeded';
  end if;

  -- Circuit breaker against distributed spam using many fake contacts.
  select count(*) into recent_global_count
  from public.club_submissions
  where created_at >= now() - interval '15 minutes';

  if recent_global_count >= 120 then
    raise exception 'Submission rate limit exceeded';
  end if;

  return new;
end;
$$;

-- Analytics is intentionally anonymous, but direct REST writes must not be able
-- to grow the tables without bounds. These triggers provide a DB-level backstop
-- even if the Next.js endpoint is bypassed.
create or replace function public.enforce_page_view_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  session_count integer;
  global_count integer;
begin
  if char_length(new.session_id) < 8 or char_length(new.session_id) > 64
     or char_length(new.path) < 1 or char_length(new.path) > 300
     or new.path !~ '^/' or new.path ~ '^/(admin|api)(/|$)' then
    raise exception 'Invalid analytics payload';
  end if;

  select count(*) into session_count from public.page_views
    where session_id = new.session_id and created_at >= now() - interval '5 minutes';
  if session_count >= 120 then raise exception 'Analytics rate limit exceeded'; end if;

  select count(*) into global_count from public.page_views
    where created_at >= now() - interval '5 minutes';
  if global_count >= 10000 then raise exception 'Analytics rate limit exceeded'; end if;
  return new;
end;
$$;

create or replace function public.enforce_analytics_event_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  session_count integer;
  global_count integer;
begin
  if char_length(new.session_id) < 8 or char_length(new.session_id) > 64
     or char_length(new.path) < 1 or char_length(new.path) > 300
     or new.path !~ '^/klub/[a-z0-9]+(?:-[a-z0-9]+)*$'
     or new.event_type not in ('maps_click', 'phone_click', 'instagram_click')
     or new.club_slug is null
     or new.club_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or new.path <> ('/klub/' || new.club_slug) then
    raise exception 'Invalid analytics payload';
  end if;

  select count(*) into session_count from public.analytics_events
    where session_id = new.session_id and created_at >= now() - interval '5 minutes';
  if session_count >= 60 then raise exception 'Analytics rate limit exceeded'; end if;

  select count(*) into global_count from public.analytics_events
    where created_at >= now() - interval '5 minutes';
  if global_count >= 5000 then raise exception 'Analytics rate limit exceeded'; end if;
  return new;
end;
$$;

drop trigger if exists enforce_page_view_rate_limit_trigger on public.page_views;
create trigger enforce_page_view_rate_limit_trigger
before insert on public.page_views
for each row execute function public.enforce_page_view_rate_limit();

drop trigger if exists enforce_analytics_event_rate_limit_trigger on public.analytics_events;
create trigger enforce_analytics_event_rate_limit_trigger
before insert on public.analytics_events
for each row execute function public.enforce_analytics_event_rate_limit();

-- Trigger functions do not need to be callable through PostgREST.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.enforce_page_view_rate_limit() from public, anon, authenticated;
revoke all on function public.enforce_analytics_event_rate_limit() from public, anon, authenticated;
revoke all on function public.enforce_club_submission_rate_limit() from public, anon, authenticated;
