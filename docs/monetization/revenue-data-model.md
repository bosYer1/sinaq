# GameYer Revenue & Monetization Data Foundation

Status: design-ready, not deployed

## Goal
Capture every commercial relationship from the first paid club onward so revenue, package history, placement performance and payment state are never reconstructed from memory or overwritten flags.

## Current gap
`clubs.is_premium` and `clubs.premium_expires_at` only describe current state. They do not preserve customer history, commercial terms, payment state, invoice/reference identifiers, campaign dates, placement scope, or historical performance.

See also `docs/monetization/september-kpi-contract.md` for the stable company measurement definitions used during September.

## Proposed model

### `business_customers`
One commercial customer record per paying business/legal counterpart. A customer can be linked to one or more clubs over time.

Core fields:
- `id uuid primary key`
- `display_name text not null`
- `legal_name text null`
- `tax_id text null`
- `contact_name text null`
- `contact_phone text null`
- `contact_email text null`
- `contact_instagram text null`
- `status text not null` (`lead`, `active`, `inactive`)
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Privacy: admin-only. No public API access.

### `commercial_packages`
Defines reusable offers without hard-coding business logic into clubs.

Core fields:
- `id uuid primary key`
- `code text unique not null`
- `name text not null`
- `description text null`
- `default_price_azn numeric(10,2) null`
- `billing_period text null` (`one_time`, `monthly`, `custom`)
- `is_active boolean not null default true`
- `created_at timestamptz not null`

Examples are intentionally not seeded until the commercial offer is approved.

### `commercial_contracts`
The historical source of truth for a sold package.

Core fields:
- `id uuid primary key`
- `customer_id uuid not null references business_customers`
- `club_id uuid null references clubs`
- `package_id uuid null references commercial_packages`
- `status text not null` (`draft`, `active`, `completed`, `cancelled`)
- `starts_at timestamptz not null`
- `ends_at timestamptz null`
- `agreed_price_azn numeric(10,2) not null`
- `discount_azn numeric(10,2) not null default 0`
- `notes text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Do not overwrite historical price when package defaults change.

### `commercial_payments`
Immutable-ish payment ledger. Corrections should be represented explicitly rather than silently replacing historical facts.

Core fields:
- `id uuid primary key`
- `contract_id uuid not null references commercial_contracts`
- `amount_azn numeric(10,2) not null`
- `status text not null` (`pending`, `paid`, `failed`, `refunded`, `cancelled`)
- `payment_method text null`
- `external_reference text null`
- `paid_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

No card numbers, CVV, passwords or sensitive payment credentials may ever be stored.

### `commercial_placements`
Maps a contract to the actual promotional inventory delivered by GameYer.

Core fields:
- `id uuid primary key`
- `contract_id uuid not null references commercial_contracts`
- `club_id uuid not null references clubs`
- `placement_type text not null`
- `starts_at timestamptz not null`
- `ends_at timestamptz null`
- `status text not null` (`scheduled`, `active`, `completed`, `cancelled`)
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null`

Potential placement types may include featured-list placement, premium badge and sponsored campaign, but production values must only be introduced when those products are actually approved.

## Admin commercial workflow

### Customer
Admin creates or selects a commercial customer. Initially only display name and status are required; legal/contact data remains optional until verified.

### Offer/package
Admin selects a reusable package or leaves `package_id` null for a custom agreement. Package price is a default only. The agreed contract price is copied to the contract and remains historical truth.

### Contract
Admin records customer, optional club, optional package, agreed price, discount, start/end dates, status and internal notes.

Rules:
- `draft` has no public effect.
- `active` may power approved placements.
- `completed` and `cancelled` preserve payment and placement history.

### Payment ledger
Each commercial money movement is a separate payment row with amount, status, method, optional external reference and paid timestamp. Historical paid facts are not silently overwritten to represent a later correction/refund.

### Placement
A sold contract is linked to delivered inventory using a stable `placement_id`. Every active monetized placement must reference an existing contract and club.

Suggested admin routes for implementation after migration:
- `/admin/kommersiya`
- `/admin/kommersiya/musteriler`
- `/admin/kommersiya/muqavileler`
- `/admin/kommersiya/odenisler`
- `/admin/kommersiya/yerlesdirmeler`

The admin actions must reuse existing `requireAdmin()` / `is_admin()` authorization. No public commercial CRUD routes.

## Analytics join contract
PostHog remains the behavioral event store. PostgreSQL remains the commercial source of truth.

Analytics events should carry stable identifiers only:
- `club_id`
- `club_slug`
- `placement_id` when applicable
- `placement_type` when applicable
- `contract_id` only when needed for internal attribution and never as visible user data

Core funnel:
`club_impression -> club_card_click -> club_page_view -> phone_click | instagram_click | maps_click`

Commercial reporting joins placement/club identifiers with aggregate PostHog metrics. Do not copy raw visitor identity into revenue tables. Do not emit customer contacts, tax identifiers, contract notes or payment references to PostHog.

## KPI definitions
For each paid placement and club:
- impressions
- unique impression sessions
- profile clicks
- CTR = profile clicks / impressions
- outbound leads = phone + Instagram + Maps unique sessions
- lead rate = outbound leads / profile clicks
- paid revenue
- outstanding revenue
- contract lifetime value

## Security contract
All commercial tables are admin-only.

Required migration behavior:
1. Enable RLS on every new `public` table.
2. Revoke default/client grants explicitly and grant back only the operations needed by the trusted authenticated admin path.
3. Use existing GameYer `is_admin()` authorization pattern; do not use user-editable JWT metadata.
4. Current production `is_admin()` requires both AAL2 and membership in `admin_users`; revenue policies must preserve this requirement.
5. Do not add public `SECURITY DEFINER` helpers.
6. Test deny cases for anon, non-admin authenticated users and AAL1 admin members.
7. Verify AAL2 admin create/read/update flows before production.

Supabase's 2026 Data API default changes mean new public tables must not assume automatic exposure/grants. Grants and RLS must be explicit in the migration.

## Compatibility with current premium flags
`clubs.is_premium` and `clubs.premium_expires_at` stay as denormalized/current presentation state for now. They must not become the financial ledger.

When a placement becomes active, admin workflow may synchronize those two fields from the authoritative commercial contract/placement. Historical contracts/payments must remain intact after premium expiry.

## Business invariants
- No payment without a contract.
- No active paid placement without an existing contract.
- Contract price remains historical truth after acceptance except through an explicit correction flow.
- Placement expiry never deletes its performance history.
- Foreign-key behavior must preserve financial history even if a club later becomes inactive.
- No automatic recurring billing or payment gateway in Phase 1.

## Implementation gates before migration is applied
- generate migration with the repository's Supabase CLI workflow; do not invent migration numbering
- explicit CHECK constraints for all status enums and non-negative monetary values
- foreign keys and indexes for `club_id`, `customer_id`, `contract_id`, active date ranges
- RLS + grants in the same migration
- migration manifest validation
- CI, Security, CodeQL and relevant DB/RLS tests PASS
- production backup/data-integrity baseline confirmed
- no automatic paid service or payment processor activation

## Phase 1 scope
Only the internal ledger and admin-safe data model. No payment gateway, checkout, automatic invoicing, subscription billing or public customer portal is activated without separate founder approval.
