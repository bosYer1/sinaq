create or replace function public.get_admin_analytics_24h()
returns jsonb
language sql
security invoker
set search_path = public, pg_temp
as $$
  with bounds as (
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
      count(distinct pv.session_id)::bigint as sessions
    from slots s
    left join public.page_views pv
      on pv.created_at >= s.slot_start
     and pv.created_at < s.slot_end
    group by s.slot_start, s.slot_end
    order by s.slot_start
  )
  select case
    when public.is_admin() then jsonb_build_object(
      'views_24h', (
        select count(*)::bigint
        from public.page_views, bounds
        where created_at >= bounds.current_start
          and created_at <= bounds.current_ts
      ),
      'sessions_24h', (
        select count(distinct session_id)::bigint
        from public.page_views, bounds
        where created_at >= bounds.current_start
          and created_at <= bounds.current_ts
      ),
      'prev_views_24h', (
        select count(*)::bigint
        from public.page_views, bounds
        where created_at >= bounds.previous_start
          and created_at < bounds.current_start
      ),
      'prev_sessions_24h', (
        select count(distinct session_id)::bigint
        from public.page_views, bounds
        where created_at >= bounds.previous_start
          and created_at < bounds.current_start
      ),
      'today_views', (
        select count(*)::bigint
        from public.page_views
        where created_at >= (date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku')
      ),
      'today_sessions', (
        select count(distinct session_id)::bigint
        from public.page_views
        where created_at >= (date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku')
      ),
      'hourly', coalesce((
        select jsonb_agg(jsonb_build_object(
          'start', slot_start,
          'end', slot_end,
          'label', to_char(slot_start at time zone 'Asia/Baku', 'HH24:MI'),
          'views', views,
          'sessions', sessions
        ) order by slot_start)
        from hourly
      ), '[]'::jsonb),
      'top_pages_24h', coalesce((
        select jsonb_agg(jsonb_build_object('path', path, 'views', views, 'sessions', sessions) order by views desc, path)
        from (
          select path, count(*)::bigint as views, count(distinct session_id)::bigint as sessions
          from public.page_views, bounds
          where created_at >= bounds.current_start
            and created_at <= bounds.current_ts
          group by path
          order by count(*) desc, path
          limit 10
        ) p
      ), '[]'::jsonb),
      'top_sources_24h', coalesce((
        select jsonb_agg(jsonb_build_object('source', source, 'views', views, 'sessions', sessions) order by views desc, source)
        from (
          select coalesce(nullif(referrer_host, ''), 'direct') as source,
                 count(*)::bigint as views,
                 count(distinct session_id)::bigint as sessions
          from public.page_views, bounds
          where created_at >= bounds.current_start
            and created_at <= bounds.current_ts
          group by 1
          order by count(*) desc, 1
          limit 10
        ) s
      ), '[]'::jsonb),
      'generated_at', now(),
      'timezone', 'Asia/Baku'
    )
    else null
  end;
$$;

revoke all on function public.get_admin_analytics_24h() from public, anon;
grant execute on function public.get_admin_analytics_24h() to authenticated;
