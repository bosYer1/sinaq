-- Keep legacy admin analytics consistent with the clean-traffic contract.
-- Repository migration only until Founder-authorized production release.
-- Synthetic/headless user agents are excluded from every page-view aggregate.
-- CTA events are intentionally unchanged because they are already constrained separately.

create or replace function public.get_admin_analytics()
returns jsonb
language sql
security invoker
set search_path to 'public', 'pg_temp'
as $function$
  with clean_page_views as (
    select *
    from public.page_views
    where coalesce(user_agent, '') !~* '(bot|crawler|spider|headless|playwright|puppeteer|lighthouse)'
  ),
  first_seen as (
    select session_id, min(created_at) as first_seen
    from clean_page_views
    group by session_id
  ), last30 as (
    select distinct session_id
    from clean_page_views
    where created_at >= now() - interval '30 days'
  )
  select case
    when public.is_admin() then jsonb_build_object(
      'today_views', (select count(*) from clean_page_views where created_at >= date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku'),
      'today_visitors', (select count(distinct session_id) from clean_page_views where created_at >= date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku'),
      'views_7d', (select count(*) from clean_page_views where created_at >= now() - interval '7 days'),
      'visitors_7d', (select count(distinct session_id) from clean_page_views where created_at >= now() - interval '7 days'),
      'prev_views_7d', (select count(*) from clean_page_views where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days'),
      'prev_visitors_7d', (select count(distinct session_id) from clean_page_views where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days'),
      'views_30d', (select count(*) from clean_page_views where created_at >= now() - interval '30 days'),
      'visitors_30d', (select count(distinct session_id) from clean_page_views where created_at >= now() - interval '30 days'),
      'prev_views_30d', (select count(*) from clean_page_views where created_at >= now() - interval '60 days' and created_at < now() - interval '30 days'),
      'prev_visitors_30d', (select count(distinct session_id) from clean_page_views where created_at >= now() - interval '60 days' and created_at < now() - interval '30 days'),
      'active_5m', (select count(distinct session_id) from clean_page_views where created_at >= now() - interval '5 minutes'),
      'active_15m', (select count(distinct session_id) from clean_page_views where created_at >= now() - interval '15 minutes'),
      'active_60m', (select count(distinct session_id) from clean_page_views where created_at >= now() - interval '60 minutes'),
      'new_visitors_30d', (select count(*) from last30 l join first_seen f using (session_id) where f.first_seen >= now() - interval '30 days'),
      'returning_visitors_30d', (select count(*) from last30 l join first_seen f using (session_id) where f.first_seen < now() - interval '30 days'),
      'cta_30d', coalesce((select jsonb_object_agg(event_type, event_count) from (select event_type, count(*)::bigint as event_count from public.analytics_events where created_at >= now() - interval '30 days' group by event_type) e), '{}'::jsonb),
      'top_action_clubs', coalesce((select jsonb_agg(jsonb_build_object('club_slug', club_slug, 'actions', actions) order by actions desc) from (select club_slug, count(*)::bigint as actions from public.analytics_events where created_at >= now() - interval '30 days' and club_slug is not null group by club_slug order by count(*) desc limit 10) c), '[]'::jsonb),
      'top_pages', coalesce((select jsonb_agg(jsonb_build_object('path', path, 'views', views, 'visitors', visitors) order by views desc) from (select path, count(*)::bigint as views, count(distinct session_id)::bigint as visitors from clean_page_views where created_at >= now() - interval '30 days' group by path order by count(*) desc limit 10) t), '[]'::jsonb),
      'top_sources', coalesce((select jsonb_agg(jsonb_build_object('source', source, 'views', views, 'visitors', visitors) order by views desc) from (select coalesce(nullif(referrer_host, ''), 'direct') as source, count(*)::bigint as views, count(distinct session_id)::bigint as visitors from clean_page_views where created_at >= now() - interval '30 days' group by 1 order by count(*) desc limit 10) s), '[]'::jsonb),
      'devices', coalesce((select jsonb_agg(jsonb_build_object('name', device, 'views', views, 'visitors', visitors) order by views desc) from (select case when user_agent is null then 'Məlum deyil' when user_agent ilike '%ipad%' or user_agent ilike '%tablet%' then 'Tablet' when user_agent ilike '%iphone%' or user_agent ilike '%android%' or user_agent ilike '%mobile%' then 'Mobil' else 'Desktop' end as device, count(*)::bigint as views, count(distinct session_id)::bigint as visitors from clean_page_views where created_at >= now() - interval '30 days' group by 1) d), '[]'::jsonb),
      'browsers', coalesce((select jsonb_agg(jsonb_build_object('name', browser, 'views', views, 'visitors', visitors) order by views desc) from (select case when user_agent is null then 'Məlum deyil' when user_agent ilike '%edg/%' then 'Edge' when user_agent ilike '%firefox/%' then 'Firefox' when user_agent ilike '%chrome/%' or user_agent ilike '%crios/%' then 'Chrome' when user_agent ilike '%safari/%' then 'Safari' else 'Digər' end as browser, count(*)::bigint as views, count(distinct session_id)::bigint as visitors from clean_page_views where created_at >= now() - interval '30 days' group by 1) b), '[]'::jsonb),
      'daily', coalesce((select jsonb_agg(jsonb_build_object('date', day::date, 'views', views, 'visitors', visitors) order by day) from (select date_trunc('day', created_at at time zone 'Asia/Baku') as day, count(*)::bigint as views, count(distinct session_id)::bigint as visitors from clean_page_views where created_at >= now() - interval '14 days' group by 1 order by 1) d), '[]'::jsonb),
      'recent_visits', coalesce((select jsonb_agg(jsonb_build_object('path', path, 'source', source, 'created_at', created_at, 'visitor', visitor, 'device', device, 'browser', browser) order by created_at desc) from (select path, coalesce(nullif(referrer_host, ''), 'direct') as source, created_at, left(session_id, 8) as visitor, case when user_agent is null then 'Məlum deyil' when user_agent ilike '%ipad%' or user_agent ilike '%tablet%' then 'Tablet' when user_agent ilike '%iphone%' or user_agent ilike '%android%' or user_agent ilike '%mobile%' then 'Mobil' else 'Desktop' end as device, case when user_agent is null then 'Məlum deyil' when user_agent ilike '%edg/%' then 'Edge' when user_agent ilike '%firefox/%' then 'Firefox' when user_agent ilike '%chrome/%' or user_agent ilike '%crios/%' then 'Chrome' when user_agent ilike '%safari/%' then 'Safari' else 'Digər' end as browser from clean_page_views order by created_at desc limit 50) r), '[]'::jsonb)
    )
    else null
  end
  from (select 1) x;
$function$;

create or replace function public.get_admin_analytics_24h()
returns jsonb
language sql
security invoker
set search_path = public, pg_temp
as $$
  with clean_page_views as (
    select *
    from public.page_views
    where coalesce(user_agent, '') !~* '(bot|crawler|spider|headless|playwright|puppeteer|lighthouse)'
  ),
  bounds as (
    select now() as current_ts,
           now() - interval '24 hours' as current_start,
           now() - interval '48 hours' as previous_start
  ),
  slots as (
    select
      b.current_start + (g.n * interval '1 hour') as slot_start,
      b.current_start + ((g.n + 1) * interval '1 hour') as slot_end
    from bounds b
    cross join generate_series(0, 23) as g(n)
  ),
  hourly as (
    select
      s.slot_start,
      s.slot_end,
      count(pv.id)::bigint as views,
      count(distinct coalesce(pv.visit_id, 'legacy:' || pv.session_id))::bigint as sessions,
      count(distinct pv.session_id)::bigint as visitors
    from slots s
    left join clean_page_views pv
      on pv.created_at >= s.slot_start
     and pv.created_at < s.slot_end
    group by s.slot_start, s.slot_end
    order by s.slot_start
  )
  select case
    when public.is_admin() then jsonb_build_object(
      'views_24h', (
        select count(*)::bigint
        from clean_page_views, bounds
        where created_at >= bounds.current_start
          and created_at <= bounds.current_ts
      ),
      'sessions_24h', (
        select count(distinct coalesce(visit_id, 'legacy:' || session_id))::bigint
        from clean_page_views, bounds
        where created_at >= bounds.current_start
          and created_at <= bounds.current_ts
      ),
      'visitors_24h', (
        select count(distinct session_id)::bigint
        from clean_page_views, bounds
        where created_at >= bounds.current_start
          and created_at <= bounds.current_ts
      ),
      'prev_views_24h', (
        select count(*)::bigint
        from clean_page_views, bounds
        where created_at >= bounds.previous_start
          and created_at < bounds.current_start
      ),
      'prev_sessions_24h', (
        select count(distinct coalesce(visit_id, 'legacy:' || session_id))::bigint
        from clean_page_views, bounds
        where created_at >= bounds.previous_start
          and created_at < bounds.current_start
      ),
      'prev_visitors_24h', (
        select count(distinct session_id)::bigint
        from clean_page_views, bounds
        where created_at >= bounds.previous_start
          and created_at < bounds.current_start
      ),
      'today_views', (
        select count(*)::bigint
        from clean_page_views
        where created_at >= (date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku')
      ),
      'today_sessions', (
        select count(distinct coalesce(visit_id, 'legacy:' || session_id))::bigint
        from clean_page_views
        where created_at >= (date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku')
      ),
      'today_visitors', (
        select count(distinct session_id)::bigint
        from clean_page_views
        where created_at >= (date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku')
      ),
      'hourly', coalesce((
        select jsonb_agg(jsonb_build_object(
          'start', slot_start,
          'end', slot_end,
          'label', to_char(slot_start at time zone 'Asia/Baku', 'HH24:MI'),
          'views', views,
          'sessions', sessions,
          'visitors', visitors
        ) order by slot_start)
        from hourly
      ), '[]'::jsonb),
      'top_pages_24h', coalesce((
        select jsonb_agg(jsonb_build_object('path', path, 'views', views, 'sessions', sessions, 'visitors', visitors) order by views desc, path)
        from (
          select
            path,
            count(*)::bigint as views,
            count(distinct coalesce(visit_id, 'legacy:' || session_id))::bigint as sessions,
            count(distinct session_id)::bigint as visitors
          from clean_page_views, bounds
          where created_at >= bounds.current_start
            and created_at <= bounds.current_ts
          group by path
          order by count(*) desc, path
          limit 10
        ) p
      ), '[]'::jsonb),
      'top_sources_24h', coalesce((
        select jsonb_agg(jsonb_build_object('source', source, 'views', views, 'sessions', sessions, 'visitors', visitors) order by sessions desc, views desc, source)
        from (
          select
            coalesce(nullif(referrer_host, ''), 'direct') as source,
            count(*)::bigint as views,
            count(distinct coalesce(visit_id, 'legacy:' || session_id))::bigint as sessions,
            count(distinct session_id)::bigint as visitors
          from clean_page_views, bounds
          where created_at >= bounds.current_start
            and created_at <= bounds.current_ts
          group by 1
          order by sessions desc, views desc, 1
          limit 10
        ) s
      ), '[]'::jsonb),
      'generated_at', now(),
      'timezone', 'Asia/Baku'
    )
    else null
  end;
$$;
