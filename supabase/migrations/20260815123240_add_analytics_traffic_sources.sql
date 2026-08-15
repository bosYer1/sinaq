create or replace function public.get_admin_analytics()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'today_views', (select count(*) from public.page_views where created_at >= date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku'),
    'today_visitors', (select count(distinct session_id) from public.page_views where created_at >= date_trunc('day', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku'),
    'views_7d', (select count(*) from public.page_views where created_at >= now() - interval '7 days'),
    'visitors_7d', (select count(distinct session_id) from public.page_views where created_at >= now() - interval '7 days'),
    'views_30d', (select count(*) from public.page_views where created_at >= now() - interval '30 days'),
    'visitors_30d', (select count(distinct session_id) from public.page_views where created_at >= now() - interval '30 days'),
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
        select
          coalesce(nullif(lower(trim(referrer_host)), ''), 'direct') as source,
          count(*)::bigint as views,
          count(distinct session_id)::bigint as visitors
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
        select
          date_trunc('day', created_at at time zone 'Asia/Baku') as day,
          count(*)::bigint as views,
          count(distinct session_id)::bigint as visitors
        from public.page_views
        where created_at >= now() - interval '14 days'
        group by 1
        order by 1
      ) d
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_admin_analytics() from public, anon;
grant execute on function public.get_admin_analytics() to authenticated;
