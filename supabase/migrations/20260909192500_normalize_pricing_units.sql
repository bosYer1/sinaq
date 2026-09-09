-- Normalize the known Ibrazoro pricing rows without changing any numeric price.
-- Currency belongs to the price formatter; `unit` stores only the billing unit/package semantics.

update public.club_pricing cp
set unit = case cp.schedule_label
  when 'Saatlıq' then 'saat'
  when '3 saat paket' then '3 saat paket'
  when '5 saat paket' then '5 saat paket'
  when '10 saat paket (00:00–10:00)' then '10 saat paket'
  else cp.unit
end
from public.clubs c
where cp.club_id = c.id
  and c.slug = 'ibrazoro-cyber-zone-28-may'
  and cp.unit = 'AZN/saat'
  and cp.schedule_label in (
    'Saatlıq',
    '3 saat paket',
    '5 saat paket',
    '10 saat paket (00:00–10:00)'
  );

update public.club_pricing cp
set unit = 'saat'
from public.clubs c
where cp.club_id = c.id
  and c.slug = 'ibrazoro-playstation'
  and cp.unit = 'AZN/saat'
  and cp.schedule_label is null;

-- Fail the migration rather than silently leaving another currency-bearing unit behind.
do $$
begin
  if exists (
    select 1
    from public.club_pricing
    where unit ~* 'azn' or position('₼' in unit) > 0
  ) then
    raise exception 'club_pricing.unit still contains a currency token after normalization';
  end if;
end;
$$;

alter table public.club_pricing
  drop constraint if exists chk_club_pricing_unit_no_currency;

alter table public.club_pricing
  add constraint chk_club_pricing_unit_no_currency
    check (unit !~* 'azn' and position('₼' in unit) = 0);

-- Keep admin relation persistence fail-fast: reject malformed units before any relation delete/replace starts.
create or replace function public.replace_club_relations_atomic(
  p_club_id uuid,
  p_assignments jsonb,
  p_pricing jsonb,
  p_hours jsonb,
  p_images jsonb
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin icazəsi tələb olunur' using errcode = '42501';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_pricing, '[]'::jsonb)) item
    where coalesce(item->>'unit', '') ~* 'azn'
       or position('₼' in coalesce(item->>'unit', '')) > 0
  ) then
    raise exception 'Qiymət vahidinə AZN və ya ₼ yazmaq olmaz. Valyuta qiymət göstəricisində ayrıca göstərilir.';
  end if;

  delete from public.club_type_assignments where club_id = p_club_id;
  insert into public.club_type_assignments (club_id, club_type_id)
  select p_club_id, (item->>'club_type_id')::uuid
  from jsonb_array_elements(coalesce(p_assignments, '[]'::jsonb)) item;

  delete from public.club_pricing where club_id = p_club_id;
  insert into public.club_pricing (
    club_id,
    club_type_id,
    price_from,
    price_to,
    unit,
    tariff_name,
    schedule_label,
    position
  )
  select
    p_club_id,
    (item->>'club_type_id')::uuid,
    (item->>'price_from')::numeric,
    nullif(item->>'price_to', '')::numeric,
    coalesce(nullif(item->>'unit', ''), 'saat'),
    nullif(btrim(item->>'tariff_name'), ''),
    nullif(btrim(item->>'schedule_label'), ''),
    greatest(coalesce((item->>'position')::integer, 0), 0)
  from jsonb_array_elements(coalesce(p_pricing, '[]'::jsonb)) item;

  delete from public.club_opening_hours where club_id = p_club_id;
  insert into public.club_opening_hours (club_id, day_of_week, open_time, close_time, is_closed)
  select
    p_club_id,
    (item->>'day_of_week')::smallint,
    nullif(item->>'open_time', '')::time,
    nullif(item->>'close_time', '')::time,
    coalesce((item->>'is_closed')::boolean, false)
  from jsonb_array_elements(coalesce(p_hours, '[]'::jsonb)) item;

  delete from public.club_images where club_id = p_club_id;
  insert into public.club_images (club_id, url, position, is_cover)
  select
    p_club_id,
    item->>'url',
    (item->>'position')::integer,
    coalesce((item->>'is_cover')::boolean, false)
  from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) item;
end;
$$;

revoke all on function public.replace_club_relations_atomic(uuid,jsonb,jsonb,jsonb,jsonb) from public;
revoke all on function public.replace_club_relations_atomic(uuid,jsonb,jsonb,jsonb,jsonb) from anon;
grant execute on function public.replace_club_relations_atomic(uuid,jsonb,jsonb,jsonb,jsonb) to authenticated;
