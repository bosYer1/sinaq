-- Candidate only. Do NOT apply directly to production.
-- Convert this reviewed SQL into a repository migration using the Supabase CLI workflow.

create table if not exists public.business_customers (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(trim(display_name)) between 2 and 160),
  legal_name text,
  tax_id text,
  contact_name text,
  contact_phone text,
  contact_email text,
  contact_instagram text,
  status text not null default 'lead' check (status in ('lead','active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commercial_packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text,
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
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.commercial_payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.commercial_contracts(id) on delete restrict,
  amount_azn numeric(10,2) not null check (amount_azn > 0),
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','cancelled')),
  payment_method text,
  external_reference text,
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

create index if not exists business_customers_status_idx on public.business_customers(status);
create index if not exists commercial_contracts_customer_id_idx on public.commercial_contracts(customer_id);
create index if not exists commercial_contracts_club_id_idx on public.commercial_contracts(club_id);
create index if not exists commercial_contracts_status_dates_idx on public.commercial_contracts(status, starts_at, ends_at);
create index if not exists commercial_payments_contract_id_idx on public.commercial_payments(contract_id);
create index if not exists commercial_payments_status_idx on public.commercial_payments(status);
create index if not exists commercial_placements_contract_id_idx on public.commercial_placements(contract_id);
create index if not exists commercial_placements_club_id_idx on public.commercial_placements(club_id);
create index if not exists commercial_placements_status_dates_idx on public.commercial_placements(status, starts_at, ends_at);

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
grant select, insert, update on table public.commercial_payments to authenticated;
grant select, insert, update, delete on table public.commercial_placements to authenticated;

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
create policy commercial_payments_admin_update on public.commercial_payments for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy commercial_placements_admin_select on public.commercial_placements for select to authenticated using ((select public.is_admin()));
create policy commercial_placements_admin_insert on public.commercial_placements for insert to authenticated with check ((select public.is_admin()));
create policy commercial_placements_admin_update on public.commercial_placements for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy commercial_placements_admin_delete on public.commercial_placements for delete to authenticated using ((select public.is_admin()));

-- service_role keeps its platform-level privileges; no public SECURITY DEFINER helpers are introduced.
-- payment DELETE is deliberately omitted for authenticated admins to preserve ledger history.
