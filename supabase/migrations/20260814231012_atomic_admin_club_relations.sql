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
  insert into public.club_pricing (club_id, club_type_id, price_from, price_to, unit)
  select
    p_club_id,
    (item->>'club_type_id')::uuid,
    (item->>'price_from')::numeric,
    nullif(item->>'price_to', '')::numeric,
    coalesce(nullif(item->>'unit', ''), 'saat')
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