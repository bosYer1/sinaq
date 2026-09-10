with xatai as (select id from public.districts where slug='xatai' limit 1)
insert into public.clubs (name,slug,district_id,address,latitude,longitude,phone,instagram_url,is_active,is_verified,verified_at)
select 'Moon','moon',xatai.id,'Fəzail Bayramov 115b',40.383781,49.867395,'050 286 44 88','https://www.instagram.com/moonpscafe/',true,true,now()
from xatai
where not exists (select 1 from public.clubs where slug='moon');

insert into public.club_type_assignments (club_id,club_type_id)
select c.id,t.id from public.clubs c join public.club_types t on t.slug='playstation'
where c.slug='moon'
on conflict do nothing;

insert into public.club_pricing (club_id,club_type_id,price_from,unit,tariff_name,position)
select c.id,t.id,v.price,'saat',v.tariff,v.pos
from public.clubs c
join public.club_types t on t.slug='playstation'
cross join (values (2::numeric,'PS3',0),(3::numeric,'PS4',1),(4::numeric,'PS5',2)) as v(price,tariff,pos)
where c.slug='moon'
and not exists (select 1 from public.club_pricing p where p.club_id=c.id and p.tariff_name=v.tariff);

insert into public.club_opening_hours (club_id,day_of_week,open_time,close_time,is_closed)
select c.id,d,'12:00'::time,'05:00'::time,false
from public.clubs c cross join generate_series(0,6) d
where c.slug='moon'
on conflict (club_id,day_of_week) do update set open_time=excluded.open_time, close_time=excluded.close_time, is_closed=false;

update public.club_submissions
set status='resolved',reviewed_at=now(),applied_at=now(),applied_fields=jsonb_build_object('club_created',true,'slug','moon')
where id='99014446-ddd4-40f7-9714-70b30f84219b';
