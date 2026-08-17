-- GameYer post-restore verification.
-- Read-only: intended for a disposable restored database, never as a destructive production action.

-- 1) Required public tables must exist.
with required(table_name) as (
  values
    ('admin_users'),
    ('analytics_events'),
    ('club_images'),
    ('club_opening_hours'),
    ('club_pricing'),
    ('club_submissions'),
    ('club_type_assignments'),
    ('club_types'),
    ('clubs'),
    ('districts'),
    ('page_views')
), present as (
  select table_name
  from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE'
)
select 'missing_required_tables' as check_name,
       coalesce(string_agg(required.table_name, ', ' order by required.table_name), '') as failures
from required
left join present using (table_name)
where present.table_name is null;

-- 2) Active club identity/location completeness.
select 'active_club_completeness' as check_name,
       count(*) filter (where name is null or btrim(name) = '') as missing_name,
       count(*) filter (where slug is null or btrim(slug) = '') as missing_slug,
       count(*) filter (where latitude is null or longitude is null) as missing_coordinates
from public.clubs
where is_active = true;

-- 3) Active slug uniqueness.
select 'duplicate_active_slugs' as check_name, slug, count(*) as duplicate_count
from public.clubs
where is_active = true
group by slug
having count(*) > 1
order by duplicate_count desc, slug;

-- 4) Orphaned application relations.
select 'orphan_club_type_assignments' as check_name, count(*) as failures
from public.club_type_assignments a
left join public.clubs c on c.id = a.club_id
left join public.club_types t on t.id = a.club_type_id
where c.id is null or t.id is null;

select 'orphan_club_pricing' as check_name, count(*) as failures
from public.club_pricing p
left join public.clubs c on c.id = p.club_id
where c.id is null;

select 'orphan_club_opening_hours' as check_name, count(*) as failures
from public.club_opening_hours h
left join public.clubs c on c.id = h.club_id
where c.id is null;

select 'orphan_club_images' as check_name, count(*) as failures
from public.club_images i
left join public.clubs c on c.id = i.club_id
where c.id is null;

-- 5) RLS inventory. Review any false value before accepting the restore.
select 'rls_inventory' as check_name, schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'admin_users','analytics_events','club_images','club_opening_hours','club_pricing',
    'club_submissions','club_type_assignments','club_types','clubs','districts','page_views'
  )
order by tablename;

-- 6) Security-critical admin helper must exist.
select 'is_admin_function' as check_name,
       count(*) as matching_functions
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'is_admin';

-- 7) Useful recovery snapshot counts.
select 'row_counts' as check_name,
       (select count(*) from public.clubs) as clubs,
       (select count(*) from public.clubs where is_active = true) as active_clubs,
       (select count(*) from public.districts) as districts,
       (select count(*) from public.club_types) as club_types,
       (select count(*) from public.club_submissions) as club_submissions;
