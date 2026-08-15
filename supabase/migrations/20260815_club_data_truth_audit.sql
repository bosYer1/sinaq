-- GameYer club truth audit — 2026-08-15
-- Preserve the production data-cleanup decisions made after broad source triangulation.
-- Product rule: clubs without usable map coordinates are not eligible for the public directory.

-- Remove records that cannot be placed reliably on the map.
delete from clubs
where latitude is null or longitude is null;

-- Closed / no-longer-public venues found during the current-source audit.
update clubs
set is_active = false, updated_at = now()
where slug in ('level-up-gaming-club', 'playrooms-gameclub');

-- Correct identity/location/contact facts backed by current sources.
update clubs
set address = 'Sülh küçəsi 242, Bakı',
    district_id = (select id from districts where slug = 'sabuncu'),
    updated_at = now()
where slug = 'fifa-cyber-club';

update clubs
set instagram_url = 'https://instagram.com/butacybercafe', updated_at = now()
where slug = 'butacybercafe';

update clubs
set instagram_url = 'https://instagram.com/vegasgamingcenter', updated_at = now()
where slug in ('vegas-gaming-center-hazi-aslanov', 'vegas-gaming-club-merkez');

update clubs
set phone = '+994 55 603 05 05', updated_at = now()
where slug = 'the-best-gaming-arena';

update clubs
set phone = '+994 12 441 32 77 / +994 50 588 22 66', updated_at = now()
where slug = 'game-club';

-- The prior descriptive placeholder was not the business name shown by the current exact-location listing.
update clubs
set name = 'Adsız Playstation klub', updated_at = now()
where slug = 'playstation-sarayevo';

-- Current directories disagree materially on Paris Playstation phone numbers.
-- Blank is safer than publishing a potentially wrong number.
update clubs
set phone = null, updated_at = now()
where slug = 'paris-playstation';

-- Exact Waze entity matches the stored Yasamal Playstation phone and reports this public location.
update clubs
set address = 'Yeni Yasamal 2, Bakı', updated_at = now()
where slug = 'yasamal-playstation';

-- Rebuild audited opening hours so fresh environments match production truth.
delete from club_opening_hours
where club_id in (
  select id from clubs where slug in ('butacybercafe', 'game-stop-playstation-club', 'yasamal-playstation')
);

-- Buta: Mon-Thu 10:00-23:30, Fri-Sat 24h, Sun 10:00-23:30.
insert into club_opening_hours (club_id, day_of_week, open_time, close_time, is_closed)
select c.id, d.day,
       case when d.day in (4,5) then '00:00'::time else '10:00'::time end,
       case when d.day in (4,5) then '23:59'::time else '23:30'::time end,
       false
from clubs c
cross join generate_series(0,6) as d(day)
where c.slug = 'butacybercafe';

-- Game Stop: daily 12:00-03:00.
insert into club_opening_hours (club_id, day_of_week, open_time, close_time, is_closed)
select c.id, d.day, '12:00'::time, '03:00'::time, false
from clubs c
cross join generate_series(0,6) as d(day)
where c.slug = 'game-stop-playstation-club';

-- Yasamal Playstation: daily 10:00-00:00.
insert into club_opening_hours (club_id, day_of_week, open_time, close_time, is_closed)
select c.id, d.day, '10:00'::time, '00:00'::time, false
from clubs c
cross join generate_series(0,6) as d(day)
where c.slug = 'yasamal-playstation';

-- Buta current published PC rate starts at 2 AZN/hour.
insert into club_pricing (club_id, club_type_id, price_from, price_to, unit)
select c.id, ct.id, 2.00, null, 'saat'
from clubs c
join club_types ct on ct.slug = 'pc'
where c.slug = 'butacybercafe'
  and not exists (
    select 1 from club_pricing p
    where p.club_id = c.id and p.club_type_id = ct.id
  );
