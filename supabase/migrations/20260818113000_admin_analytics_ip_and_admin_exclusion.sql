alter table public.page_views
  add column if not exists ip_address inet;

create index if not exists idx_page_views_ip_created_at
  on public.page_views (ip_address, created_at desc);

create or replace function public.get_admin_analytics()
returns jsonb
language sql
security invoker
set search_path = public, pg_temp
as $$
  select case
    when public.is_admin() then jsonb_build_object(
      'today_views', (select count(*) from public.page_views where created_at >= date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku'),
      'today_visitors', (select count(distinct session_id) from public.page_views where created_at >= date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku'),
      'views_7d', (select count(*) from public.page_views where created_at >= now() - interval '7 days'),
      'visitors_7d', (select count(distinct session_id) from public.page_views where created_at >= now() - interval '7 days'),
      'views_30d', (select count(*) from public.page_views where created_at >= now() - interval '30 days'),
      'visitors_30d', (select count(distinct session_id) from public.page_views where created_at >= now() - interval '30 days'),
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
          'visitor', visitor
        ) order by created_at desc)
        from (
          select
            coalesce(ip_address::text, 'məlum deyil') as ip,
            path,
            coalesce(nullif(referrer_host, ''), 'direct') as source,
            created_at,
            left(session_id, 8) as visitor
          from public.page_views
          order by created_at desc
          limit 50
        ) r
      ), '[]'::jsonb)
    )
    else null
  end;
$$;

revoke all on function public.get_admin_analytics() from public, anon;
grant execute on function public.get_admin_analytics() to authenticated;
