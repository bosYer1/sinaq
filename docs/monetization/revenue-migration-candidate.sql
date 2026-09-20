-- Candidate only. Do NOT apply directly to production.
-- Convert this reviewed SQL into a repository migration through the Supabase migration workflow.

create table if not exists public.business_customers (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(trim(display_name)) between 2 and 160),
  legal_name text check (legal_name is null or char_length(legal_name) <= 200),
  tax_id text check (tax_id is null or char_length(tax_id) <= 64),
  contact_name text check (contact_name is null or char_length(contact_name) <= 160),
  contact_phone text check (contact_phone is null or char_length(contact_phone) <= 64),
  contact_email text check (contact_email is null or char_length(contact_email) <= 254),
  contact_instagram text check (contact_instagram is null or char_length(contact_instagram) <= 200),
  status text not null default 'lead' check (status in ('lead','active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commercial_packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text check (description is null or char_length(description) <= 2000),
  default_price_azn numeric(10,2) check (default_price_azn is null or default_price_azn >= 0),
  billing_period text check (billing_period is null or billing_period in ('one_time','monthly','custom')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commercial_contracts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.business_customers(id) on delete restrict,
  club_id uuid references public.clubs(id) on delete restrict,
  package_id uuid references public.commercial_packages(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','active','completed','cancelled')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  agreed_price_azn numeric(10,2) not null check (agreed_price_azn >= 0),
  discount_azn numeric(10,2) not null default 0 check (discount_azn >= 0 and discount_azn <= agreed_price_azn),
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.commercial_payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.commercial_contracts(id) on delete restrict,
  amount_azn numeric(10,2) not null check (amount_azn > 0),
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','cancelled')),
  payment_method text check (payment_method is null or char_length(payment_method) <= 80),
  external_reference text check (external_reference is null or char_length(external_reference) <= 200),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'paid' and paid_at is not null) or status <> 'paid')
);

create table if not exists public.commercial_placements (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.commercial_contracts(id) on delete restrict,
  club_id uuid not null references public.clubs(id) on delete restrict,
  placement_type text not null check (char_length(trim(placement_type)) between 2 and 64),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','active','completed','cancelled')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.commercial_opportunities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.business_customers(id) on delete restrict,
  club_id uuid references public.clubs(id) on delete restrict,
  package_id uuid references public.commercial_packages(id) on delete set null,
  contract_id uuid references public.commercial_contracts(id) on delete set null,
  stage text not null default 'targeted' check (stage in ('targeted','contacted','replied','offered','paid','activated','reported','renewed','lost')),
  offer_price_azn numeric(10,2) check (offer_price_azn is null or offer_price_azn >= 0),
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  lost_reason text check (lost_reason is null or char_length(lost_reason) <= 1000),
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (stage <> 'lost' or lost_reason is not null)
);

create table if not exists public.commercial_performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.commercial_placements(id) on delete restrict,
  club_id uuid not null references public.clubs(id) on delete restrict,
  snapshot_type text not null check (snapshot_type in ('baseline','day7','final')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  profile_views integer not null default 0 check (profile_views >= 0),
  view_sessions integer not null default 0 check (view_sessions >= 0),
  phone_clicks integer not null default 0 check (phone_clicks >= 0),
  instagram_clicks integer not null default 0 check (instagram_clicks >= 0),
  maps_clicks integer not null default 0 check (maps_clicks >= 0),
  intent_sessions integer not null default 0 check (intent_sessions >= 0),
  created_at timestamptz not null default now(),
  check (period_end > period_start),
  unique (placement_id, snapshot_type)
);

create index if not exists business_customers_status_idx on public.business_customers(status);
create index if not exists commercial_contracts_customer_id_idx on public.commercial_contracts(customer_id);
create index if not exists commercial_contracts_club_id_idx on public.commercial_contracts(club_id);
create index if not exists commercial_contracts_status_dates_idx on public.commercial_contracts(status, starts_at, ends_at);
create index if not exists commercial_payments_contract_id_idx on public.commercial_payments(contract_id);
create index if not exists commercial_payments_status_idx on public.commercial_payments(status);
create index if not exists commercial_placements_contract_id_idx on public.commercial_placements(contract_id);
create index if not exists commercial_placements_club_id_idx on public.commercial_placements(club_id);
create index if not exists commercial_placements_status_dates_idx on public.commercial_placements(status, starts_at, ends_at);
create index if not exists commercial_opportunities_stage_idx on public.commercial_opportunities(stage, updated_at desc);
create index if not exists commercial_opportunities_club_id_idx on public.commercial_opportunities(club_id);
create unique index if not exists commercial_opportunities_one_open_per_club_idx
  on public.commercial_opportunities(club_id)
  where club_id is not null and stage not in ('reported','renewed','lost');
create index if not exists commercial_opportunities_follow_up_idx on public.commercial_opportunities(next_follow_up_at) where next_follow_up_at is not null;
create index if not exists commercial_performance_snapshots_placement_idx on public.commercial_performance_snapshots(placement_id, created_at desc);
create unique index if not exists commercial_opportunities_contract_id_uidx
  on public.commercial_opportunities(contract_id)
  where contract_id is not null;
create unique index if not exists commercial_payments_paid_contract_uidx
  on public.commercial_payments(contract_id)
  where status = 'paid';
create unique index if not exists commercial_payments_external_reference_uidx
  on public.commercial_payments(external_reference)
  where external_reference is not null and btrim(external_reference) <> '';
create unique index if not exists commercial_placements_contract_type_uidx
  on public.commercial_placements(contract_id, placement_type);
create unique index if not exists commercial_placements_one_active_premium_per_club_uidx
  on public.commercial_placements(club_id)
  where placement_type = 'premium_discovery' and status = 'active';

alter table public.business_customers enable row level security;
alter table public.commercial_packages enable row level security;
alter table public.commercial_contracts enable row level security;
alter table public.commercial_payments enable row level security;
alter table public.commercial_placements enable row level security;
alter table public.commercial_opportunities enable row level security;
alter table public.commercial_performance_snapshots enable row level security;

revoke all on table public.business_customers from anon, authenticated;
revoke all on table public.commercial_packages from anon, authenticated;
revoke all on table public.commercial_contracts from anon, authenticated;
revoke all on table public.commercial_payments from anon, authenticated;
revoke all on table public.commercial_placements from anon, authenticated;
revoke all on table public.commercial_opportunities from anon, authenticated;
revoke all on table public.commercial_performance_snapshots from anon, authenticated;

grant select, insert, update, delete on table public.business_customers to authenticated;
grant select, insert, update, delete on table public.commercial_packages to authenticated;
grant select, insert, update, delete on table public.commercial_contracts to authenticated;
grant select, insert on table public.commercial_payments to authenticated;
grant select, insert, update, delete on table public.commercial_placements to authenticated;
grant select, insert, update, delete on table public.commercial_opportunities to authenticated;
grant select, insert, delete on table public.commercial_performance_snapshots to authenticated;

create policy business_customers_admin_select on public.business_customers for select to authenticated using ((select public.is_admin()));
create policy business_customers_admin_insert on public.business_customers for insert to authenticated with check ((select public.is_admin()));
create policy business_customers_admin_update on public.business_customers for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy business_customers_admin_delete on public.business_customers for delete to authenticated using ((select public.is_admin()));

create policy commercial_packages_admin_select on public.commercial_packages for select to authenticated using ((select public.is_admin()));
create policy commercial_packages_admin_insert on public.commercial_packages for insert to authenticated with check ((select public.is_admin()));
create policy commercial_packages_admin_update on public.commercial_packages for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy commercial_packages_admin_delete on public.commercial_packages for delete to authenticated using ((select public.is_admin()));

create policy commercial_contracts_admin_select on public.commercial_contracts for select to authenticated using ((select public.is_admin()));
create policy commercial_contracts_admin_insert on public.commercial_contracts for insert to authenticated with check ((select public.is_admin()));
create policy commercial_contracts_admin_update on public.commercial_contracts for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy commercial_contracts_admin_delete on public.commercial_contracts for delete to authenticated using ((select public.is_admin()));

create policy commercial_payments_admin_select on public.commercial_payments for select to authenticated using ((select public.is_admin()));
create policy commercial_payments_admin_insert on public.commercial_payments for insert to authenticated with check ((select public.is_admin()));
create policy commercial_placements_admin_select on public.commercial_placements for select to authenticated using ((select public.is_admin()));
create policy commercial_placements_admin_insert on public.commercial_placements for insert to authenticated with check ((select public.is_admin()));
create policy commercial_placements_admin_update on public.commercial_placements for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy commercial_placements_admin_delete on public.commercial_placements for delete to authenticated using ((select public.is_admin()));

create policy commercial_opportunities_admin_select on public.commercial_opportunities for select to authenticated using ((select public.is_admin()));
create policy commercial_opportunities_admin_insert on public.commercial_opportunities for insert to authenticated with check ((select public.is_admin()));
create policy commercial_opportunities_admin_update on public.commercial_opportunities for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy commercial_opportunities_admin_delete on public.commercial_opportunities for delete to authenticated using ((select public.is_admin()));

create policy commercial_performance_snapshots_admin_select on public.commercial_performance_snapshots for select to authenticated using ((select public.is_admin()));
create policy commercial_performance_snapshots_admin_insert on public.commercial_performance_snapshots for insert to authenticated with check ((select public.is_admin()));
create policy commercial_performance_snapshots_admin_delete on public.commercial_performance_snapshots for delete to authenticated using ((select public.is_admin()));

create trigger set_business_customers_updated_at before update on public.business_customers for each row execute function public.set_updated_at();
create trigger set_commercial_packages_updated_at before update on public.commercial_packages for each row execute function public.set_updated_at();
create trigger set_commercial_contracts_updated_at before update on public.commercial_contracts for each row execute function public.set_updated_at();
create trigger set_commercial_payments_updated_at before update on public.commercial_payments for each row execute function public.set_updated_at();
create trigger set_commercial_placements_updated_at before update on public.commercial_placements for each row execute function public.set_updated_at();
create trigger set_commercial_opportunities_updated_at before update on public.commercial_opportunities for each row execute function public.set_updated_at();


create or replace function public.record_paid_commercial_sale_atomic(
  p_opportunity_id uuid,
  p_agreed_price_azn numeric,
  p_discount_azn numeric,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_payment_method text default null,
  p_external_reference text default null,
  p_contract_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $
declare
  v_opportunity public.commercial_opportunities%rowtype;
  v_contract_id uuid;
  v_net_amount numeric;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  if p_agreed_price_azn is null or p_agreed_price_azn <= 0 then
    raise exception 'Agreed price must be greater than zero.' using errcode = '22023';
  end if;
  if p_discount_azn is null or p_discount_azn < 0 or p_discount_azn > p_agreed_price_azn then
    raise exception 'Discount is outside the allowed range.' using errcode = '22023';
  end if;
  if p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'Contract dates are invalid.' using errcode = '22023';
  end if;

  select *
    into v_opportunity
  from public.commercial_opportunities
  where id = p_opportunity_id
  for update;

  if not found then
    raise exception 'Opportunity not found.' using errcode = 'P0002';
  end if;
  if v_opportunity.club_id is null then
    raise exception 'Opportunity is not linked to a club.' using errcode = '22023';
  end if;

  if v_opportunity.contract_id is not null then
    if exists (
      select 1
      from public.commercial_payments
      where contract_id = v_opportunity.contract_id
        and status = 'paid'
    ) then
      return v_opportunity.contract_id;
    end if;
    raise exception 'Opportunity already has an incomplete contract.' using errcode = '23505';
  end if;

  v_net_amount := p_agreed_price_azn - p_discount_azn;
  if v_net_amount <= 0 then
    raise exception 'Net paid amount must be greater than zero.' using errcode = '22023';
  end if;

  insert into public.commercial_contracts (
    customer_id, club_id, package_id, status, starts_at, ends_at,
    agreed_price_azn, discount_azn, notes
  )
  values (
    v_opportunity.customer_id, v_opportunity.club_id, v_opportunity.package_id, 'draft',
    p_starts_at, p_ends_at, p_agreed_price_azn, p_discount_azn, p_contract_notes
  )
  returning id into v_contract_id;

  insert into public.commercial_payments (
    contract_id, amount_azn, status, payment_method, external_reference, paid_at
  )
  values (
    v_contract_id, v_net_amount, 'paid',
    nullif(btrim(p_payment_method), ''),
    nullif(btrim(p_external_reference), ''),
    now()
  );

  update public.commercial_contracts
  set status = 'active'
  where id = v_contract_id;

  update public.commercial_opportunities
  set contract_id = v_contract_id, stage = 'paid'
  where id = p_opportunity_id;

  update public.business_customers
  set status = 'active'
  where id = v_opportunity.customer_id;

  return v_contract_id;
end;
$;

revoke execute on function public.record_paid_commercial_sale_atomic(uuid,numeric,numeric,timestamptz,timestamptz,text,text,text) from public, anon, authenticated;
grant execute on function public.record_paid_commercial_sale_atomic(uuid,numeric,numeric,timestamptz,timestamptz,text,text,text) to authenticated;

create or replace function public.activate_commercial_premium_atomic(
  p_contract_id uuid,
  p_baseline_start timestamptz,
  p_baseline_end timestamptz,
  p_profile_views integer,
  p_view_sessions integer,
  p_phone_clicks integer,
  p_instagram_clicks integer,
  p_maps_clicks integer,
  p_intent_sessions integer
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $
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
    p_maps_clicks, p_intent_sessions
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
    profile_views, view_sessions, phone_clicks, instagram_clicks, maps_clicks, intent_sessions
  )
  values (
    v_placement_id, v_club_id, 'baseline', p_baseline_start, p_baseline_end,
    p_profile_views, p_view_sessions, p_phone_clicks, p_instagram_clicks, p_maps_clicks, p_intent_sessions
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
$;

revoke execute on function public.activate_commercial_premium_atomic(uuid,timestamptz,timestamptz,integer,integer,integer,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.activate_commercial_premium_atomic(uuid,timestamptz,timestamptz,integer,integer,integer,integer,integer,integer) to authenticated;

create or replace function public.finalize_commercial_performance_atomic(
  p_placement_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_profile_views integer,
  p_view_sessions integer,
  p_phone_clicks integer,
  p_instagram_clicks integer,
  p_maps_clicks integer,
  p_intent_sessions integer
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $
declare
  v_placement public.commercial_placements%rowtype;
  v_club_id uuid;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  if least(
    p_profile_views, p_view_sessions, p_phone_clicks, p_instagram_clicks,
    p_maps_clicks, p_intent_sessions
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
    profile_views, view_sessions, phone_clicks, instagram_clicks, maps_clicks, intent_sessions
  )
  values (
    v_placement.id, v_placement.club_id, 'final', p_period_start, p_period_end,
    p_profile_views, p_view_sessions, p_phone_clicks, p_instagram_clicks, p_maps_clicks, p_intent_sessions
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
$;

revoke execute on function public.finalize_commercial_performance_atomic(uuid,timestamptz,timestamptz,integer,integer,integer,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.finalize_commercial_performance_atomic(uuid,timestamptz,timestamptz,integer,integer,integer,integer,integer,integer) to authenticated;


insert into public.commercial_packages (code, name, description, default_price_azn, billing_period, is_active)
values (
  'premium_founder_30d',
  'GameYer Premium — Founding Partner',
  '30 günlük Premium discovery yerləşdirməsi və ölçülmüş nəticə hesabatı. İlk kommersiya validasiya paketi.',
  29.00,
  'one_time',
  true
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  default_price_azn = excluded.default_price_azn,
  billing_period = excluded.billing_period,
  is_active = excluded.is_active,
  updated_at = now();

-- service_role keeps its platform-level privileges; no privileged helper functions are introduced.
-- payment DELETE is deliberately omitted for authenticated admins to preserve ledger history.
