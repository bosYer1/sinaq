create or replace function public.apply_owner_claim_fields_atomic(
  p_submission_id uuid,
  p_instagram_url text default null,
  p_pc_price numeric default null,
  p_ps_price numeric default null,
  p_hours jsonb default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_club_id uuid;
  v_status text;
  v_type_id uuid;
  v_open_time time;
  v_close_time time;
  v_applied jsonb := '{}'::jsonb;
  v_pricing_count integer;
  v_detailed_count integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select club_id, status
  into v_club_id, v_status
  from public.club_submissions
  where id = p_submission_id
    and kind = 'owner_claim'
  for update;

  if v_club_id is null then
    raise exception 'Owner claim or linked club not found';
  end if;

  if v_status in ('resolved', 'rejected') then
    raise exception 'Completed owner claim cannot be modified';
  end if;

  if p_instagram_url is not null then
    if p_instagram_url !~* '^https://www\.instagram\.com/[a-z0-9._]{1,30}/$' then
      raise exception 'Invalid Instagram URL';
    end if;

    update public.clubs
    set instagram_url = p_instagram_url
    where id = v_club_id;

    v_applied := v_applied || jsonb_build_object('instagram_url', p_instagram_url);
  end if;

  if p_pc_price is not null then
    if p_pc_price <= 0 or p_pc_price > 1000 then
      raise exception 'Invalid PC price';
    end if;

    select id into v_type_id from public.club_types where slug = 'pc';
    if v_type_id is null or not exists (
      select 1 from public.club_type_assignments
      where club_id = v_club_id and club_type_id = v_type_id
    ) then
      raise exception 'PC type is not assigned to this club';
    end if;

    select
      count(*),
      count(*) filter (where tariff_name is not null or schedule_label is not null)
    into v_pricing_count, v_detailed_count
    from public.club_pricing
    where club_id = v_club_id and club_type_id = v_type_id;

    if v_pricing_count = 0 then
      insert into public.club_pricing (club_id, club_type_id, price_from, price_to, unit, position)
      values (v_club_id, v_type_id, p_pc_price, null, 'saat', 0);
    elsif v_pricing_count = 1 and v_detailed_count = 0 then
      update public.club_pricing
      set price_from = p_pc_price, price_to = null, unit = 'saat'
      where club_id = v_club_id and club_type_id = v_type_id;
    else
      raise exception 'Detailed PC pricing exists; update it from the club admin pricing editor';
    end if;

    v_applied := v_applied || jsonb_build_object('pc_price', p_pc_price);
  end if;

  if p_ps_price is not null then
    if p_ps_price <= 0 or p_ps_price > 1000 then
      raise exception 'Invalid PlayStation price';
    end if;

    select id into v_type_id from public.club_types where slug = 'playstation';
    if v_type_id is null or not exists (
      select 1 from public.club_type_assignments
      where club_id = v_club_id and club_type_id = v_type_id
    ) then
      raise exception 'PlayStation type is not assigned to this club';
    end if;

    select
      count(*),
      count(*) filter (where tariff_name is not null or schedule_label is not null)
    into v_pricing_count, v_detailed_count
    from public.club_pricing
    where club_id = v_club_id and club_type_id = v_type_id;

    if v_pricing_count = 0 then
      insert into public.club_pricing (club_id, club_type_id, price_from, price_to, unit, position)
      values (v_club_id, v_type_id, p_ps_price, null, 'saat', 0);
    elsif v_pricing_count = 1 and v_detailed_count = 0 then
      update public.club_pricing
      set price_from = p_ps_price, price_to = null, unit = 'saat'
      where club_id = v_club_id and club_type_id = v_type_id;
    else
      raise exception 'Detailed PlayStation pricing exists; update it from the club admin pricing editor';
    end if;

    v_applied := v_applied || jsonb_build_object('ps_price', p_ps_price);
  end if;

  if p_hours is not null then
    if p_hours->>'mode' = '24/7' then
      v_open_time := '00:00:00'::time;
      v_close_time := '23:59:59'::time;
    elsif p_hours->>'mode' = 'daily' then
      begin
        v_open_time := (p_hours->>'open_time')::time;
        v_close_time := (p_hours->>'close_time')::time;
      exception when others then
        raise exception 'Invalid opening hours';
      end;
    else
      raise exception 'Invalid opening hours mode';
    end if;

    insert into public.club_opening_hours (club_id, day_of_week, open_time, close_time, is_closed)
    select v_club_id, day_number, v_open_time, v_close_time, false
    from generate_series(0, 6) as day_number
    on conflict (club_id, day_of_week)
    do update set
      open_time = excluded.open_time,
      close_time = excluded.close_time,
      is_closed = false;

    v_applied := v_applied || jsonb_build_object('hours', p_hours);
  end if;

  if v_applied = '{}'::jsonb then
    raise exception 'No owner claim fields selected';
  end if;

  update public.club_submissions
  set
    status = 'reviewing',
    reviewed_at = now(),
    applied_fields = coalesce(applied_fields, '{}'::jsonb) || v_applied,
    applied_at = now()
  where id = p_submission_id;

  return v_club_id;
end;
$$;

revoke all on function public.apply_owner_claim_fields_atomic(uuid, text, numeric, numeric, jsonb) from public, anon;
grant execute on function public.apply_owner_claim_fields_atomic(uuid, text, numeric, numeric, jsonb) to authenticated;
