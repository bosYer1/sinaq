-- GameYer final-launch data expansion: 30 additional real Baku gaming venues.
-- Idempotent: existing slugs are preserved. Apply once immediately before final production release.
-- Verification manifest: docs/CLUB_SOURCE_MANIFEST_2026-08-15.md

with new_clubs(name, slug, description, district_slug, address, phone, kind) as (
  values
    ('Prime Cyber Club','prime-cyber-club','24/7 kompüter və cyber klub.','xatai','Məzahir Rüstəmov küçəsi 35, Bakı','+994 70 767 77 57','pc'),
    ('Bunker Racing Bar','bunker-racing-bar','Gaming club və racing bar.','nasimi','Nizami küçəsi 121B, Bakı',null,'pc'),
    ('LaLiga Lounge - AzTU','laliga-lounge-aztu','LaLiga gaming lounge filialı.','yasamal','Hüseyn Cavid prospekti 76, Bakı',null,'playstation'),
    ('LaLiga Lounge - Gənclik','laliga-lounge-genclik','LaLiga gaming lounge filialı.','narimanov','Fətəli xan Xoyski prospekti 49H, Bakı',null,'playstation'),
    ('LaLiga Lounge - Elmlər 2','laliga-lounge-elmler-2','LaLiga gaming lounge filialı.','yasamal','Zahid Xəlilov küçəsi 11, Bakı',null,'playstation'),
    ('LaLiga Lounge - Tibb','laliga-lounge-tibb','LaLiga gaming lounge filialı.','nasimi','Səməd Vurğun küçəsi 192, Bakı',null,'playstation'),
    ('Playstation - 20 Yanvar 35P','playstation-20-yanvar-35p','PlayStation oyun klubu.','nasimi','20 Yanvar küçəsi 35P, Bakı',null,'playstation'),
    ('Paris Playstation','paris-playstation','PlayStation oyun klubu.','nasimi','Mirzəbala Məmmədzadə küçəsi 37X, Bakı',null,'playstation'),
    ('Yer6 Playstation','yer6-playstation','PlayStation oyun klubu.','narimanov','Fətəli xan Xoyski prospekti 208C, Bakı',null,'playstation'),
    ('İnternet Club - Kunanbayev','internet-club-kunanbayev','Gaming və internet klub.','binaqadi','Abay Kunanbayev küçəsi 68C, Bakı',null,'pc'),
    ('Maracana Game Club','maracana-game-club','Gaming klub.','yasamal','Bəxtiyar Vahabzadə küçəsi 64, Bakı',null,'playstation'),
    ('Playstation - Mirəli Seyidov','playstation-mireli-seyidov','PlayStation oyun klubu.','yasamal','Mirəli Seyidov küçəsi 88D, Bakı',null,'playstation'),
    ('Internet Club Infiniti','internet-club-infiniti','24/7 internet və gaming klub.','narimanov','Əli Tağızadə küçəsi 4B, Bakı',null,'pc'),
    ('Nil Gaming Club','nil-gaming-club','Gaming klub.','nizami','Abdulla Qarayev küçəsi 48, Bakı',null,'pc'),
    ('77 Playstation Game Room','77-playstation-game-room','PlayStation oyun otağı.','nizami','Arif Mehdiyev küçəsi 156C, Bakı',null,'playstation'),
    ('Vegas - Yeni Günəşli','vegas-yeni-gunesli','Gaming / console club.','suraxani','Yeni Günəşli, Surxay Noçuyev küçəsi 517A, Bakı',null,'playstation'),
    ('Game Mania','game-mania','Gaming klub.','xatai','Nəsrəddin Tusi küçəsi 216, Bakı',null,'pc'),
    ('Fifa Playzone','fifa-playzone','Gaming klub.','xatai','Rahib Məmmədov küçəsi 236D, Bakı',null,'playstation'),
    ('Game Zone - Xudadat','game-zone-xudadat','Gaming klub.','nizami','Xudadat Məlikaslanov 11-ci döngə 123, Bakı',null,'pc'),
    ('Game Zone 107','game-zone-107','Gaming klub.','sabuncu','Abbas Fətullayev küçəsi 144, Bakı',null,'pc'),
    ('Derbi Game Club','derbi-game-club','Gaming klub.','sabuncu','Əsildar Məmmədəliyev küçəsi 30, Bakı',null,'pc'),
    ('Reburn Gaming','reburn-gaming','Gaming club və bar.','narimanov','Lütfi Zadə küçəsi 13, Bakı',null,'pc'),
    ('05 Oyun Zalı','05-oyun-zali','Kompüter və gaming oyun zalı.','sabuncu','Cəlal Qurbanov küçəsi 79, Bakı',null,'pc'),
    ('PSG PlayStation Club','psg-playstation-club','PlayStation oyun klubu.','suraxani','Bakı, Suraxanı rayonu',null,'playstation'),
    ('PS Playstation Club - 20 Yanvar','ps-playstation-club-20-yanvar','24/7 PlayStation oyun klubu.','nasimi','20 Yanvar küçəsi 1, Bakı','+994 50 695 00 03','playstation'),
    ('M3 Gaming Club','m3-gaming-club','24/7 gaming və internet klub.','suraxani','Bakı, Suraxanı rayonu',null,'pc'),
    ('Nova Bizon Cyber','nova-bizon-cyber','Cyber və kompüter klubu.','nasimi','Bülbül prospekti 36, Bakı','+994 10 303 36 38','pc'),
    ('Yasamal Playstation','yasamal-playstation','PlayStation oyun klubu.','yasamal','Murad Mirzəyev küçəsi, Bakı','+994 55 824 07 74','playstation'),
    ('Fora Playstation - Həzi Aslanov','fora-playstation-hazi-aslanov','PlayStation oyun mərkəzi.','xatai','Həzi Aslanov, Xətai rayonu, Bakı','+994 55 797 32 31','playstation'),
    ('PlayStation Club - 9QGV','playstation-club-9qgv','PlayStation / internet klub.','yasamal','Bakı, Yasamal rayonu','+994 77 622 96 96','playstation')
), inserted as (
  insert into clubs (name, slug, description, district_id, address, phone, is_active, is_verified)
  select n.name, n.slug, n.description, d.id, n.address, n.phone, true, false
  from new_clubs n
  join districts d on d.slug = n.district_slug
  on conflict (slug) do nothing
  returning id, slug
)
insert into club_type_assignments (club_id, club_type_id)
select c.id, ct.id
from new_clubs n
join clubs c on c.slug = n.slug
join club_types ct on ct.slug = n.kind
where not exists (
  select 1 from club_type_assignments a
  where a.club_id = c.id and a.club_type_id = ct.id
);

-- Known opening hours from current public listings. Uncertain schedules are intentionally omitted.
with schedules(slug, open_time, close_time) as (
  values
    ('prime-cyber-club','00:00'::time,'23:59'::time),
    ('internet-club-infiniti','00:00'::time,'23:59'::time),
    ('ps-playstation-club-20-yanvar','00:00'::time,'23:59'::time),
    ('m3-gaming-club','00:00'::time,'23:59'::time)
)
insert into club_opening_hours (club_id, day_of_week, open_time, close_time, is_closed)
select c.id, d.day, s.open_time, s.close_time, false
from schedules s
join clubs c on c.slug = s.slug
cross join generate_series(0,6) as d(day)
where not exists (
  select 1 from club_opening_hours h
  where h.club_id = c.id and h.day_of_week = d.day
);
