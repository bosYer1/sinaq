import fs from 'node:fs';

const sql = fs.readFileSync('docs/monetization/revenue-migration-candidate.sql', 'utf8');
const canonical = fs.readFileSync('supabase/migrations/20260920144246_add_commercial_revenue_os.sql', 'utf8');

const tables = [
  'business_customers',
  'commercial_packages',
  'commercial_contracts',
  'commercial_payments',
  'commercial_placements',
];

for (const table of tables) {
  if (!sql.includes(`create table if not exists public.${table}`)) throw new Error(`Missing table ${table}`);
  if (!sql.includes(`alter table public.${table} enable row level security;`)) throw new Error(`RLS missing for ${table}`);
  if (!sql.includes(`revoke all on table public.${table} from anon, authenticated;`)) throw new Error(`Explicit revoke missing for ${table}`);
  if (!sql.includes(`to authenticated`) || !sql.includes(`public.is_admin()`)) throw new Error('Admin policy contract missing');
}

for (const statusSet of [
  "('lead','active','inactive')",
  "('draft','active','completed','cancelled')",
  "('pending','paid','failed','refunded','cancelled')",
  "('scheduled','active','completed','cancelled')",
]) {
  if (!sql.includes(statusSet)) throw new Error(`Missing status constraint ${statusSet}`);
}

if (!sql.includes('agreed_price_azn >= 0')) throw new Error('Contract amount constraint missing');
if (!sql.includes('discount_azn >= 0 and discount_azn <= agreed_price_azn')) throw new Error('Discount bound missing');
if (!sql.includes('amount_azn > 0')) throw new Error('Payment amount constraint missing');
if (!sql.includes("jsonb_typeof(metadata) = 'object'")) throw new Error('Placement metadata object constraint missing');
if (/security\s+definer/i.test(sql)) throw new Error('SECURITY DEFINER must not appear in candidate SQL');
if (/security\s+definer/i.test(canonical)) throw new Error('SECURITY DEFINER must not appear in canonical Revenue OS migration');
if ((canonical.match(/as \$gameyer_commercial\$/g) || []).length !== 3) throw new Error('Canonical migration must contain three valid named PL/pgSQL dollar-quote openers');
if ((canonical.match(/\$gameyer_commercial\$;/g) || []).length !== 3) throw new Error('Canonical migration must contain three valid named PL/pgSQL dollar-quote closers');
if (/as \$(?!gameyer_commercial\$)/.test(canonical)) throw new Error('Canonical migration contains an invalid single-dollar PL/pgSQL delimiter');
if (/grant\s+.*\s+to\s+anon/i.test(sql)) throw new Error('Revenue tables must not grant privileges to anon');
if (/grant\s+delete\s+on\s+table\s+public\.commercial_payments/i.test(sql)) throw new Error('Payment DELETE must remain disabled');
if (/card_number|cvv|password|pan\b/i.test(sql)) throw new Error('Sensitive payment credential field detected');
if (!canonical.includes('record_paid_commercial_sale_atomic') || !canonical.includes('activate_commercial_premium_atomic') || !canonical.includes('finalize_commercial_performance_atomic')) {
  throw new Error('Canonical migration is missing atomic commercial lifecycle RPCs');
}
if (!canonical.includes('commercial_placements_one_active_premium_per_club_uidx')) throw new Error('Canonical migration is missing the one-active-Premium invariant');
if (!canonical.includes("'premium_founder_30d'")) throw new Error('Canonical migration is missing the reviewed founding package seed');

console.log('Revenue migration candidate security regression passed.');
