-- Measure browser-local recent-club return clicks in the existing privacy-safe analytics_events table.
-- recent_club_click identifies the homepage recent-club shortcut. It is not an outbound commercial intent.

alter table public.analytics_events
  drop constraint if exists analytics_events_type_valid;

alter table public.analytics_events
  add constraint analytics_events_type_valid
  check (
    event_type = any (
      array[
        'maps_click'::text,
        'phone_click'::text,
        'instagram_click'::text,
        'club_correction_click'::text,
        'whatsapp_booking_click'::text,
        'recent_club_click'::text
      ]
    )
  );

-- Keep the privacy-safe trigger aligned with the event constraint.
-- recent_club_click is emitted on the homepage and carries the target club in club_slug.
create or replace function public.enforce_analytics_event_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $gameyer_analytics$
declare
  session_count integer;
  global_count integer;
begin
  if char_length(new.session_id) < 8
     or char_length(new.session_id) > 64
     or char_length(new.path) < 1
     or char_length(new.path) > 300
     or new.event_type not in (
       'maps_click',
       'phone_click',
       'instagram_click',
       'club_correction_click',
       'whatsapp_booking_click',
       'recent_club_click'
     )
     or new.club_slug is null
     or new.club_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or (
       new.event_type = 'recent_club_click'
       and new.path <> '/'
     )
     or (
       new.event_type <> 'recent_club_click'
       and (
         new.path !~ '^/klub/[a-z0-9]+(?:-[a-z0-9]+)*$'
         or new.path <> ('/klub/' || new.club_slug)
       )
     )
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
$gameyer_analytics$;
