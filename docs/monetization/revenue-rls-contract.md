# Revenue RLS & Grant Contract

Status: implementation-ready design, not applied to production.

## Access model
All commercial data is internal company data. No public browser flow needs direct access.

Tables in scope:
- `business_customers`
- `commercial_packages`
- `commercial_contracts`
- `commercial_payments`
- `commercial_placements`

## Authorization source
Use the existing `public.is_admin()` function as the only application-level authorization predicate for authenticated admin access.

Current production contract verified on 2026-09-01:
- requires `auth.jwt()->>'aal' = 'aal2'`
- requires `auth.uid()` to exist in `public.admin_users`

Do not use `user_metadata` for authorization.

## Grants
For every table in this package:

```sql
alter table public.<table> enable row level security;
revoke all on table public.<table> from anon, authenticated;
grant select, insert, update, delete on table public.<table> to authenticated;
```

`service_role` keeps trusted server access only. No frontend code may contain a service-role/secret key.

The explicit `authenticated` grant is intentional: Postgres checks grants before RLS. RLS then restricts those operations to rows for which `public.is_admin()` is true.

## Policies
Each table gets operation-specific policies, not a single permissive policy.

```sql
create policy "Admins can read <table>"
on public.<table>
for select
to authenticated
using ((select public.is_admin()));

create policy "Admins can insert <table>"
on public.<table>
for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins can update <table>"
on public.<table>
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete <table>"
on public.<table>
for delete
to authenticated
using ((select public.is_admin()));
```

No `anon` policies.

## Required constraints

### `business_customers`
- `status in ('lead','active','inactive')`
- trim/non-empty `display_name`

### `commercial_packages`
- `billing_period is null or billing_period in ('one_time','monthly','custom')`
- `default_price_azn is null or default_price_azn >= 0`
- non-empty unique `code`
- non-empty `name`

### `commercial_contracts`
- `status in ('draft','active','completed','cancelled')`
- `agreed_price_azn >= 0`
- `discount_azn >= 0`
- `discount_azn <= agreed_price_azn`
- `ends_at is null or ends_at >= starts_at`

### `commercial_payments`
- `amount_azn > 0`
- `status in ('pending','paid','failed','refunded','cancelled')`
- `paid_at` may be set only for states that represent a completed/refunded payment record
- never store card number, CVV, account password or payment credential

### `commercial_placements`
- `status in ('scheduled','active','completed','cancelled')`
- non-empty `placement_type`
- `ends_at is null or ends_at >= starts_at`

## Indexes
Minimum:
- `business_customers(status)`
- `commercial_contracts(customer_id)`
- `commercial_contracts(club_id)`
- `commercial_contracts(status, starts_at, ends_at)`
- `commercial_payments(contract_id)`
- `commercial_payments(status, paid_at)`
- `commercial_placements(contract_id)`
- `commercial_placements(club_id)`
- `commercial_placements(status, starts_at, ends_at)`

## RLS deny tests
For each table, automated DB tests must prove:
1. `anon` SELECT denied.
2. `anon` INSERT denied.
3. non-admin `authenticated` SELECT denied by RLS.
4. non-admin `authenticated` INSERT denied by RLS.
5. non-admin `authenticated` UPDATE denied by RLS.
6. non-admin `authenticated` DELETE denied by RLS.
7. AAL1 admin-user session is still denied because `is_admin()` requires AAL2.
8. AAL2 user present in `admin_users` can SELECT/INSERT/UPDATE/DELETE valid rows.
9. invalid status/negative money/date-range rows fail CHECK constraints even for admin.

## Data API rule
Supabase's 2026 Data API behavior is changing toward opt-in exposure for new public tables. This migration must not depend on platform defaults. Grants and RLS must be explicit and co-located in the migration.

## Migration rule
Do not manually invent a timestamped migration filename. Generate it through the repository Supabase CLI workflow, then place the schema, constraints, grants, policies and indexes in that generated migration.
