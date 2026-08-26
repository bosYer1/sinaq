-- Separate persistent visitors from browser-tab visits without deleting historical analytics.
-- Existing session_id values remain the persistent visitor identifier for backward compatibility.

alter table public.page_views
  add column if not exists visit_id text;

alter table public.page_views
  drop constraint if exists page_views_visit_id_length;
alter table public.page_views
  add constraint page_views_visit_id_length
  check (visit_id is null or char_length(visit_id) between 8 and 64);

create index if not exists idx_page_views_visit_created_at
  on public.page_views (visit_id, created_at desc)
  where visit_id is not null;

-- The public endpoint owns these fields. Do not re-open INSERT access to system-owned columns.
revoke insert on table public.page_views from anon, authenticated;
grant insert (session_id, visit_id, path, referrer_host, user_agent)
  on table public.page_views to anon, authenticated;

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
      count(distinct coalesce(pv.visit_id, 'legacy:' || pv.session_id))::bigint as sessions,
      count(distinct pv.session_id)::bigint as visitors
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
        select count(distinct coalesce(visit_id, 'legacy:' || session_id))::bigint
        from public.page_views, bounds
        where created_at >= bounds.current_start
          and created_at <= bounds.current_ts
      ),
      'visitors_24h', (
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
        select count(distinct coalesce(visit_id, 'legacy:' || session_id))::bigint
        from public.page_views, bounds
        where created_at >= bounds.previous_start
          and created_at < bounds.current_start
      ),
      'prev_visitors_24h', (
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
        select count(distinct coalesce(visit_id, 'legacy:' || session_id))::bigint
        from public.page_views
        where created_at >= (date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku')
      ),
      'today_visitors', (
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
          from public.page_views, bounds
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
          from public.page_views, bounds
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

revoke all on function public.get_admin_analytics_24h() from public, anon;
grant execute on function public.get_admin_analytics_24h() to authenticated;
