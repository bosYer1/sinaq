alter table public.page_views
  add column if not exists user_agent text;

alter table public.page_views
  drop constraint if exists page_views_user_agent_length;
alter table public.page_views
  add constraint page_views_user_agent_length
  check (user_agent is null or char_length(user_agent) <= 500);

create index if not exists idx_page_views_session_created_at_v2
  on public.page_views (session_id, created_at desc);

create or replace function public.get_admin_analytics()
returns jsonb
language sql
security invoker
set search_path = public, pg_temp
as $$
  with first_seen as (
    select session_id, min(created_at) as first_seen
    from public.page_views
    group by session_id
  ), last30 as (
    select distinct session_id
    from public.page_views
    where created_at >= now() - interval '30 days'
  )
  select case
    when public.is_admin() then jsonb_build_object(
      'today_views', (select count(*) from public.page_views where created_at >= date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku'),
      'today_visitors', (select count(distinct session_id) from public.page_views where created_at >= date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku'),
      'views_7d', (select count(*) from public.page_views where created_at >= now() - interval '7 days'),
      'visitors_7d', (select count(distinct session_id) from public.page_views where created_at >= now() - interval '7 days'),
      'prev_views_7d', (select count(*) from public.page_views where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days'),
      'prev_visitors_7d', (select count(distinct session_id) from public.page_views where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days'),
      'views_30d', (select count(*) from public.page_views where created_at >= now() - interval '30 days'),
      'visitors_30d', (select count(distinct session_id) from public.page_views where created_at >= now() - interval '30 days'),
      'prev_views_30d', (select count(*) from public.page_views where created_at >= now() - interval '60 days' and created_at < now() - interval '30 days'),
      'prev_visitors_30d', (select count(distinct session_id) from public.page_views where created_at >= now() - interval '60 days' and created_at < now() - interval '30 days'),
      'active_5m', (select count(distinct session_id) from public.page_views where created_at >= now() - interval '5 minutes'),
      'active_15m', (select count(distinct session_id) from public.page_views where created_at >= now() - interval '15 minutes'),
      'active_60m', (select count(distinct session_id) from public.page_views where created_at >= now() - interval '60 minutes'),
      'new_visitors_30d', (select count(*) from last30 l join first_seen f using (session_id) where f.first_seen >= now() - interval '30 days'),
      'returning_visitors_30d', (select count(*) from last30 l join first_seen f using (session_id) where f.first_seen < now() - interval '30 days'),
      'cta_30d', coalesce((
        select jsonb_object_agg(event_type, event_count)
        from (
          select event_type, count(*)::bigint as event_count
          from public.analytics_events
          where created_at >= now() - interval '30 days'
          group by event_type
        ) e
      ), '{}'::jsonb),
      'top_action_clubs', coalesce((
        select jsonb_agg(jsonb_build_object('club_slug', club_slug, 'actions', actions) order by actions desc)
        from (
          select club_slug, count(*)::bigint as actions
          from public.analytics_events
          where created_at >= now() - interval '30 days' and club_slug is not null
          group by club_slug
          order by count(*) desc
          limit 10
        ) c
      ), '[]'::jsonb),
      'top_pages', coalesce((
        select jsonb_agg(jsonb_build_object('path', path, 'views', views, 'visitors', visitors) order by views desc)
        from (
          select path, count(*)::bigint as views, count(distinct session_id)::bigint as visitors
          from public.page_views
          where created_at >= now() - interval '30 days'
          group by path
          order by count(*) desc
          limit 10
        ) t
      ), '[]'::jsonb),
      'top_sources', coalesce((
        select jsonb_agg(jsonb_build_object('source', source, 'views', views, 'visitors', visitors) order by views desc)
        from (
          select coalesce(nullif(referrer_host, ''), 'direct') as source, count(*)::bigint as views, count(distinct session_id)::bigint as visitors
          from public.page_views
          where created_at >= now() - interval '30 days'
          group by 1
          order by count(*) desc
          limit 10
        ) s
      ), '[]'::jsonb),
      'devices', coalesce((
        select jsonb_agg(jsonb_build_object('name', device, 'views', views, 'visitors', visitors) order by views desc)
        from (
          select case
            when user_agent is null then 'Məlum deyil'
            when user_agent ilike '%ipad%' or user_agent ilike '%tablet%' then 'Tablet'
            when user_agent ilike '%iphone%' or user_agent ilike '%android%' or user_agent ilike '%mobile%' then 'Mobil'
            else 'Desktop'
          end as device,
          count(*)::bigint as views,
          count(distinct session_id)::bigint as visitors
          from public.page_views
          where created_at >= now() - interval '30 days'
          group by 1
        ) d
      ), '[]'::jsonb),
      'browsers', coalesce((
        select jsonb_agg(jsonb_build_object('name', browser, 'views', views, 'visitors', visitors) order by views desc)
        from (
          select case
            when user_agent is null then 'Məlum deyil'
            when user_agent ilike '%edg/%' then 'Edge'
            when user_agent ilike '%firefox/%' then 'Firefox'
            when user_agent ilike '%chrome/%' or user_agent ilike '%crios/%' then 'Chrome'
            when user_agent ilike '%safari/%' then 'Safari'
            else 'Digər'
          end as browser,
          count(*)::bigint as views,
          count(distinct session_id)::bigint as visitors
          from public.page_views
          where created_at >= now() - interval '30 days'
          group by 1
        ) b
      ), '[]'::jsonb),
      'top_ips', coalesce((
        select jsonb_agg(jsonb_build_object('ip', ip, 'views', views, 'visitors', visitors, 'last_seen', last_seen) order by views desc)
        from (
          select ip_address::text as ip, count(*)::bigint as views, count(distinct session_id)::bigint as visitors, max(created_at) as last_seen
          from public.page_views
          where created_at >= now() - interval '30 days' and ip_address is not null
          group by ip_address
          order by count(*) desc
          limit 10
        ) i
      ), '[]'::jsonb),
      'daily', coalesce((
        select jsonb_agg(jsonb_build_object('date', day::date, 'views', views, 'visitors', visitors) order by day)
        from (
          select date_trunc('day', created_at at time zone 'Asia/Baku') as day,
                 count(*)::bigint as views,
                 count(distinct session_id)::bigint as visitors
          from public.page_views
          where created_at >= now() - interval '14 days'
          group by 1
          order by 1
        ) d
      ), '[]'::jsonb),
      'recent_visits', coalesce((
        select jsonb_agg(jsonb_build_object(
          'ip', ip,
          'path', path,
          'source', source,
          'created_at', created_at,
          'visitor', visitor,
          'device', device,
          'browser', browser
        ) order by created_at desc)
        from (
          select
            coalesce(ip_address::text, 'məlum deyil') as ip,
            path,
            coalesce(nullif(referrer_host, ''), 'direct') as source,
            created_at,
            left(session_id, 8) as visitor,
            case
              when user_agent is null then 'Məlum deyil'
              when user_agent ilike '%ipad%' or user_agent ilike '%tablet%' then 'Tablet'
              when user_agent ilike '%iphone%' or user_agent ilike '%android%' or user_agent ilike '%mobile%' then 'Mobil'
              else 'Desktop'
            end as device,
            case
              when user_agent is null then 'Məlum deyil'
              when user_agent ilike '%edg/%' then 'Edge'
              when user_agent ilike '%firefox/%' then 'Firefox'
              when user_agent ilike '%chrome/%' or user_agent ilike '%crios/%' then 'Chrome'
              when user_agent ilike '%safari/%' then 'Safari'
              else 'Digər'
            end as browser
          from public.page_views
          order by created_at desc
          limit 50
        ) r
      ), '[]'::jsonb)
    )
    else null
  end
  from (select 1) x;
$$;

revoke all on function public.get_admin_analytics() from public, anon;
grant execute on function public.get_admin_analytics() to authenticated;
