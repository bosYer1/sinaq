alter table public.club_pricing
  drop constraint if exists uq_club_pricing_club_type;

alter table public.club_pricing
  add column if not exists tariff_name text,
  add column if not exists schedule_label text,
  add column if not exists position integer not null default 0;

alter table public.club_pricing
  add constraint chk_club_pricing_tariff_name_length
    check (tariff_name is null or char_length(tariff_name) between 1 and 80),
  add constraint chk_club_pricing_schedule_label_length
    check (schedule_label is null or char_length(schedule_label) between 1 and 120),
  add constraint chk_club_pricing_position_nonnegative
    check (position >= 0);

create index if not exists idx_club_pricing_club_type_position
  on public.club_pricing (club_id, club_type_id, position, price_from);

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
