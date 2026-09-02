-- GameYer revenue/monetization migration blueprint.
-- DESIGN ONLY. Do not apply this file directly to production.
-- Generate the real migration with `supabase migration new <name>` first,
-- then review/copy the approved statements into the generated migration.

create table public.business_customers (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  legal_name text,
  tax_id text,
  contact_name text,
  contact_phone text,
  contact_email text,
  contact_instagram text,
  status text not null default 'lead',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_customers_display_name_check check (length(btrim(display_name)) > 0),
  constraint business_customers_status_check check (status in ('lead','active','inactive'))
);

create table public.commercial_packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  default_price_azn numeric(10,2),
  billing_period text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint commercial_packages_code_check check (length(btrim(code)) > 0),
  constraint commercial_packages_name_check check (length(btrim(name)) > 0),
  constraint commercial_packages_default_price_check check (default_price_azn is null or default_price_azn >= 0),
  constraint commercial_packages_billing_period_check check (billing_period is null or billing_period in ('one_time','monthly','custom'))
);

create table public.commercial_contracts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.business_customers(id) on delete restrict,
  club_id uuid references public.clubs(id) on delete restrict,
  package_id uuid references public.commercial_packages(id) on delete restrict,
  status text not null default 'draft',
  starts_at timestamptz not null,
  ends_at timestamptz,
  agreed_price_azn numeric(10,2) not null,
  discount_azn numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_contracts_status_check check (status in ('draft','active','completed','cancelled')),
  constraint commercial_contracts_price_check check (agreed_price_azn >= 0),
  constraint commercial_contracts_discount_check check (discount_azn >= 0 and discount_azn <= agreed_price_azn),
  constraint commercial_contracts_dates_check check (ends_at is null or ends_at >= starts_at)
);

create table public.commercial_payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.commercial_contracts(id) on delete restrict,
  amount_azn numeric(10,2) not null,
  status text not null default 'pending',
  payment_method text,
  external_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_payments_amount_check check (amount_azn > 0),
  constraint commercial_payments_status_check check (status in ('pending','paid','failed','refunded','cancelled')),
  constraint commercial_payments_paid_at_check check (
    (status in ('paid','refunded') and paid_at is not null)
    or (status in ('pending','failed','cancelled') and paid_at is null)
  )
);

create table public.commercial_placements (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.commercial_contracts(id) on delete restrict,
  club_id uuid not null references public.clubs(id) on delete restrict,
  placement_type text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint commercial_placements_type_check check (length(btrim(placement_type)) > 0),
  constraint commercial_placements_status_check check (status in ('scheduled','active','completed','cancelled')),
  constraint commercial_placements_dates_check check (ends_at is null or ends_at >= starts_at),
  constraint commercial_placements_metadata_check check (jsonb_typeof(metadata) = 'object')
);

create index business_customers_status_idx on public.business_customers(status);
create index commercial_contracts_customer_id_idx on public.commercial_contracts(customer_id);
create index commercial_contracts_club_id_idx on public.commercial_contracts(club_id);
create index commercial_contracts_status_dates_idx on public.commercial_contracts(status, starts_at, ends_at);
create index commercial_payments_contract_id_idx on public.commercial_payments(contract_id);
create index commercial_payments_status_paid_at_idx on public.commercial_payments(status, paid_at);
create index commercial_placements_contract_id_idx on public.commercial_placements(contract_id);
create index commercial_placements_club_id_idx on public.commercial_placements(club_id);
create index commercial_placements_status_dates_idx on public.commercial_placements(status, starts_at, ends_at);

alter table public.business_customers enable row level security;
alter table public.commercial_packages enable row level security;
alter table public.commercial_contracts enable row level security;
alter table public.commercial_payments enable row level security;
alter table public.commercial_placements enable row level security;

revoke all on table public.business_customers from anon, authenticated;
revoke all on table public.commercial_packages from anon, authenticated;
revoke all on table public.commercial_contracts from anon, authenticated;
revoke all on table public.commercial_payments from anon, authenticated;
revoke all on table public.commercial_placements from anon, authenticated;

grant select, insert, update, delete on table public.business_customers to authenticated;
grant select, insert, update, delete on table public.commercial_packages to authenticated;
grant select, insert, update, delete on table public.commercial_contracts to authenticated;
grant select, insert, update, delete on table public.commercial_payments to authenticated;
grant select, insert, update, delete on table public.commercial_placements to authenticated;

create policy "Admins read business customers" on public.business_customers
for select to authenticated using ((select public.is_admin()));
create policy "Admins insert business customers" on public.business_customers
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update business customers" on public.business_customers
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete business customers" on public.business_customers
for delete to authenticated using ((select public.is_admin()));

create policy "Admins read commercial packages" on public.commercial_packages
for select to authenticated using ((select public.is_admin()));
create policy "Admins insert commercial packages" on public.commercial_packages
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update commercial packages" on public.commercial_packages
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete commercial packages" on public.commercial_packages
for delete to authenticated using ((select public.is_admin()));

create policy "Admins read commercial contracts" on public.commercial_contracts
for select to authenticated using ((select public.is_admin()));
create policy "Admins insert commercial contracts" on public.commercial_contracts
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update commercial contracts" on public.commercial_contracts
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete commercial contracts" on public.commercial_contracts
for delete to authenticated using ((select public.is_admin()));

create policy "Admins read commercial payments" on public.commercial_payments
for select to authenticated using ((select public.is_admin()));
create policy "Admins insert commercial payments" on public.commercial_payments
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update commercial payments" on public.commercial_payments
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete commercial payments" on public.commercial_payments
for delete to authenticated using ((select public.is_admin()));

create policy "Admins read commercial placements" on public.commercial_placements
for select to authenticated using ((select public.is_admin()));
create policy "Admins insert commercial placements" on public.commercial_placements
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update commercial placements" on public.commercial_placements
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete commercial placements" on public.commercial_placements
for delete to authenticated using ((select public.is_admin()));

-- Before real migration approval:
-- 1) Decide whether delete should remain available in admin UI or be replaced by archival/status-only flows.
-- 2) Add updated_at trigger using the repository's existing safe pattern if one exists.
-- 3) Add pgTAP/Supabase DB tests for anon/non-admin/AAL1 denial and AAL2-admin allow cases.
-- 4) Run migration manifest, CI, Security, CodeQL, DB advisors/tests.
