-- Keep the database analytics contract aligned with the public API and UI.
-- club_correction_click contains only the same bounded session/path/club slug fields
-- already accepted for the other club CTA events.

alter table public.analytics_events
  drop constraint if exists analytics_events_type_valid;

alter table public.analytics_events
  add constraint analytics_events_type_valid
  check (event_type in ('maps_click', 'phone_click', 'instagram_click', 'club_correction_click'));

drop policy if exists anon_insert_analytics_events on public.analytics_events;
create policy anon_insert_analytics_events on public.analytics_events
  for insert to anon
  with check (
    char_length(session_id) between 8 and 64
    and char_length(path) between 1 and 300
    and path like '/%'
    and path not like '/admin%'
    and path not like '/api%'
    and event_type in ('maps_click', 'phone_click', 'instagram_click', 'club_correction_click')
    and (club_slug is null or club_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
  );

drop policy if exists authenticated_insert_analytics_events on public.analytics_events;
create policy authenticated_insert_analytics_events on public.analytics_events
  for insert to authenticated
  with check (
    char_length(session_id) between 8 and 64
    and char_length(path) between 1 and 300
    and path like '/%'
    and path not like '/admin%'
    and path not like '/api%'
    and event_type in ('maps_click', 'phone_click', 'instagram_click', 'club_correction_click')
    and (club_slug is null or club_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
  );

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
  if char_length(new.session_id) < 8
     or char_length(new.session_id) > 64
     or char_length(new.path) < 1
     or char_length(new.path) > 300
     or new.path !~ '^/klub/[a-z0-9]+(?:-[a-z0-9]+)*$'
     or new.event_type not in ('maps_click', 'phone_click', 'instagram_click', 'club_correction_click')
     or new.club_slug is null
     or new.club_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or new.path <> ('/klub/' || new.club_slug)
  then
    raise exception 'Invalid analytics payload';
  end if;

  select count(*) into session_count
  from public.analytics_events
  where session_id = new.session_id
    and created_at >= now() - interval '5 minutes';

  if session_count >= 30 then
    raise exception 'Analytics rate limit exceeded';
  end if;

  select count(*) into global_count
  from public.analytics_events
  where created_at >= now() - interval '5 minutes';

  if global_count >= 1500 then
    raise exception 'Analytics rate limit exceeded';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_analytics_event_rate_limit() from public, anon, authenticated;
