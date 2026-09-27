-- Add TikTok first-party intent parity across analytics and Revenue OS.
-- Repository migration only until the Founder authorizes the production release/migration.

alter table public.analytics_events
  drop constraint if exists analytics_events_type_valid;

alter table public.analytics_events
  add constraint analytics_events_type_valid
  check (
    event_type = any (
      array[
        'maps_click'::text,
        'phone_click'::text,
        'instagram_click'::text,
        'tiktok_click'::text,
        'club_correction_click'::text,
        'whatsapp_booking_click'::text,
        'recent_club_click'::text
      ]
    )
  );

create or replace function public.enforce_analytics_event_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $gameyer_analytics$
declare
  session_count integer;
  global_count integer;
begin
  if char_length(new.session_id) < 8
     or char_length(new.session_id) > 64
     or char_length(new.path) < 1
     or char_length(new.path) > 300
     or new.event_type not in (
       'maps_click',
       'phone_click',
       'instagram_click',
       'tiktok_click',
       'club_correction_click',
       'whatsapp_booking_click',
       'recent_club_click'
     )
     or new.club_slug is null
     or new.club_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or (
       new.event_type = 'recent_club_click'
       and new.path <> '/'
     )
     or (
       new.event_type <> 'recent_club_click'
       and (
         new.path !~ '^/klub/[a-z0-9]+(?:-[a-z0-9]+)*$'
         or new.path <> ('/klub/' || new.club_slug)
       )
     )
  then
    raise exception 'Invalid analytics payload';
  end if;

  select count(*) into session_count
  from public.analytics_events
  where session_id = new.session_id
    and created_at >= now() - interval '5 minutes';

  if session_count >= 30 then
    raise exception 'Analytics rate limit exceeded';
  end if;

  select count(*) into global_count
  from public.analytics_events
  where created_at >= now() - interval '5 minutes';

  if global_count >= 1500 then
    raise exception 'Analytics rate limit exceeded';
  end if;

  return new;
end;
$gameyer_analytics$;

alter table public.commercial_performance_snapshots
  add column if not exists tiktok_clicks integer not null default 0
  check (tiktok_clicks >= 0);

drop function if exists public.activate_commercial_premium_atomic(
  uuid,timestamptz,timestamptz,integer,integer,integer,integer,integer,integer,integer
);

drop function if exists public.finalize_commercial_performance_atomic(
  uuid,timestamptz,timestamptz,integer,integer,integer,integer,integer,integer,integer
);

create or replace function public.activate_commercial_premium_atomic(
  p_contract_id uuid,
  p_baseline_start timestamptz,
  p_baseline_end timestamptz,
  p_profile_views integer,
  p_view_sessions integer,
  p_phone_clicks integer,
  p_instagram_clicks integer,
  p_maps_clicks integer,
  p_whatsapp_clicks integer,
  p_tiktok_clicks integer,
  p_intent_sessions integer
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $gameyer_commercial$
declare
  v_contract public.commercial_contracts%rowtype;
  v_club_id uuid;
  v_placement_id uuid;
  v_required_total numeric;
  v_net_paid numeric;
  v_expected_baseline_start timestamptz;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  if least(
    p_profile_views, p_view_sessions, p_phone_clicks, p_instagram_clicks,
    p_maps_clicks, p_whatsapp_clicks, p_tiktok_clicks, p_intent_sessions
  ) < 0 then
    raise exception 'Baseline metrics cannot be negative.' using errcode = '22023';
  end if;

  select *
    into v_contract
  from public.commercial_contracts
  where id = p_contract_id
  for update;

  if not found then
    raise exception 'Contract not found.' using errcode = 'P0002';
  end if;
  if v_contract.status <> 'active' or v_contract.club_id is null or v_contract.ends_at is null then
    raise exception 'Only active dated club contracts can be activated.' using errcode = '22023';
  end if;
  if v_contract.starts_at > now() then
    raise exception 'Premium start date has not arrived.' using errcode = '22023';
  end if;
  if v_contract.ends_at <= now() then
    raise exception 'Contract has expired.' using errcode = '22023';
  end if;

  v_expected_baseline_start := v_contract.starts_at - interval '30 days';
  if p_baseline_end <> v_contract.starts_at or p_baseline_start <> v_expected_baseline_start then
    raise exception 'Baseline window does not match contract dates.' using errcode = '22023';
  end if;

  select id
    into v_club_id
  from public.clubs
  where id = v_contract.club_id
  for update;

  if not found then
    raise exception 'Club not found.' using errcode = 'P0002';
  end if;

  select coalesce(sum(
    case
      when status = 'paid' then amount_azn
      when status = 'refunded' then -amount_azn
      else 0
    end
  ), 0)
    into v_net_paid
  from public.commercial_payments
  where contract_id = p_contract_id;

  v_required_total := v_contract.agreed_price_azn - v_contract.discount_azn;
  if v_net_paid + 0.001 < v_required_total then
    raise exception 'Contract must be fully paid before Premium activation.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.commercial_placements
    where club_id = v_club_id
      and placement_type = 'premium_discovery'
      and status = 'active'
      and contract_id <> p_contract_id
  ) then
    raise exception 'Another active Premium placement already exists for this club.' using errcode = '23505';
  end if;

  select id
    into v_placement_id
  from public.commercial_placements
  where contract_id = p_contract_id
    and placement_type = 'premium_discovery'
  for update;

  if v_placement_id is null then
    insert into public.commercial_placements (
      contract_id, club_id, placement_type, starts_at, ends_at, status, metadata
    )
    values (
      p_contract_id, v_club_id, 'premium_discovery',
      v_contract.starts_at, v_contract.ends_at, 'active',
      '{"source":"commercial_revenue_os","package":"premium"}'::jsonb
    )
    returning id into v_placement_id;
  else
    update public.commercial_placements
    set status = 'active',
        starts_at = v_contract.starts_at,
        ends_at = v_contract.ends_at
    where id = v_placement_id;
  end if;

  insert into public.commercial_performance_snapshots (
    placement_id, club_id, snapshot_type, period_start, period_end,
    profile_views, view_sessions, phone_clicks, instagram_clicks, maps_clicks, whatsapp_clicks, tiktok_clicks, intent_sessions
  )
  values (
    v_placement_id, v_club_id, 'baseline', p_baseline_start, p_baseline_end,
    p_profile_views, p_view_sessions, p_phone_clicks, p_instagram_clicks, p_maps_clicks, p_whatsapp_clicks, p_tiktok_clicks, p_intent_sessions
  )
  on conflict (placement_id, snapshot_type) do nothing;

  update public.clubs
  set is_premium = true,
      premium_expires_at = v_contract.ends_at,
      updated_at = now()
  where id = v_club_id;

  update public.commercial_opportunities
  set stage = 'activated'
  where contract_id = p_contract_id;

  if not found then
    raise exception 'Contract is not linked to an opportunity.' using errcode = 'P0002';
  end if;

  return v_placement_id;
end;
$gameyer_commercial$;
revoke execute on function public.activate_commercial_premium_atomic(uuid,timestamptz,timestamptz,integer,integer,integer,integer,integer,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.activate_commercial_premium_atomic(uuid,timestamptz,timestamptz,integer,integer,integer,integer,integer,integer,integer,integer) to authenticated;

create or replace function public.finalize_commercial_performance_atomic(
  p_placement_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_profile_views integer,
  p_view_sessions integer,
  p_phone_clicks integer,
  p_instagram_clicks integer,
  p_maps_clicks integer,
  p_whatsapp_clicks integer,
  p_tiktok_clicks integer,
  p_intent_sessions integer
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $gameyer_commercial$
declare
  v_placement public.commercial_placements%rowtype;
  v_club_id uuid;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  if least(
    p_profile_views, p_view_sessions, p_phone_clicks, p_instagram_clicks,
    p_maps_clicks, p_whatsapp_clicks, p_tiktok_clicks, p_intent_sessions
  ) < 0 then
    raise exception 'Final metrics cannot be negative.' using errcode = '22023';
  end if;

  select *
    into v_placement
  from public.commercial_placements
  where id = p_placement_id
  for update;

  if not found then
    raise exception 'Placement not found.' using errcode = 'P0002';
  end if;
  if v_placement.ends_at is null or now() < v_placement.ends_at then
    raise exception 'Final checkpoint is available only after placement end.' using errcode = '22023';
  end if;
  if p_period_start <> v_placement.starts_at or p_period_end <> v_placement.ends_at then
    raise exception 'Final metric window does not match placement dates.' using errcode = '22023';
  end if;

  select id
    into v_club_id
  from public.clubs
  where id = v_placement.club_id
  for update;

  if not found then
    raise exception 'Club not found.' using errcode = 'P0002';
  end if;

  insert into public.commercial_performance_snapshots (
    placement_id, club_id, snapshot_type, period_start, period_end,
    profile_views, view_sessions, phone_clicks, instagram_clicks, maps_clicks, whatsapp_clicks, tiktok_clicks, intent_sessions
  )
  values (
    v_placement.id, v_placement.club_id, 'final', p_period_start, p_period_end,
    p_profile_views, p_view_sessions, p_phone_clicks, p_instagram_clicks, p_maps_clicks, p_whatsapp_clicks, p_tiktok_clicks, p_intent_sessions
  )
  on conflict (placement_id, snapshot_type) do nothing;

  update public.commercial_placements
  set status = 'completed'
  where id = v_placement.id;

  update public.commercial_contracts
  set status = 'completed'
  where id = v_placement.contract_id;

  update public.commercial_opportunities
  set stage = 'reported'
  where contract_id = v_placement.contract_id;

  if not found then
    raise exception 'Contract is not linked to an opportunity.' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.commercial_placements
    where club_id = v_placement.club_id
      and placement_type = 'premium_discovery'
      and status = 'active'
      and id <> v_placement.id
  ) then
    update public.clubs
    set is_premium = false,
        premium_expires_at = null,
        updated_at = now()
    where id = v_placement.club_id;
  end if;

  return v_placement.id;
end;
$gameyer_commercial$;
revoke execute on function public.finalize_commercial_performance_atomic(uuid,timestamptz,timestamptz,integer,integer,integer,integer,integer,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.finalize_commercial_performance_atomic(uuid,timestamptz,timestamptz,integer,integer,integer,integer,integer,integer,integer,integer) to authenticated;
