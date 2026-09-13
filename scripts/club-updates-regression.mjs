import fs from 'node:fs';

const baseMigration = fs.readFileSync('supabase/migrations/20260909122500_add_club_updates.sql', 'utf8');
const ongoingMigration = fs.readFileSync('supabase/migrations/20260909170000_support_ongoing_club_offers.sql', 'utf8');
const query = fs.readFileSync('src/lib/queries/club-updates.ts', 'utf8');
const feed = fs.readFileSync('src/components/growth/ClubUpdatesFeed.tsx', 'utf8');
const page = fs.readFileSync('src/app/yenilikler/page.tsx', 'utf8');

const checks = [
  [baseMigration.includes("kind in ('tournament', 'offer')"), 'club updates are limited to tournament and offer kinds'],
  [baseMigration.includes("source_url ~ '^https://'"), 'club updates require an HTTPS evidence source'],
  [baseMigration.includes('with check (is_admin())'), 'writes stay admin-gated'],
  [baseMigration.includes('execute function public.set_updated_at()'), 'updates keep updated_at current'],
  [ongoingMigration.includes('alter column ends_at drop not null'), 'offers may omit a fabricated business expiry'],
  [ongoingMigration.includes("kind = 'tournament' and ends_at is not null"), 'tournaments still require a real end date'],
  [ongoingMigration.includes('reverify_after > verified_at'), 'ongoing verification TTL must follow the verification time'],
  [ongoingMigration.includes("reverify_after <= verified_at + interval '7 days'"), 'ongoing offers cannot be marked fresh for more than seven days'],
  [ongoingMigration.includes('reverify_after > now()'), 'public policy hides stale ongoing offers'],
  [query.includes(".eq('is_active', true)"), 'public query requests only active updates'],
  [query.includes('ends_at.gt.${nowIso}'), 'public query keeps non-expired dated updates'],
  [query.includes('and(kind.eq.offer,ends_at.is.null,reverify_after.gt.${nowIso})'), 'public query includes only freshly reverified ongoing offers'],
  [query.includes('function firstRelatedRow<T>'), 'embedded Supabase relations are normalized before use'],
  [query.includes('const club = firstRelatedRow(item.club);'), 'many-to-one club relation supports object responses'],
  [query.includes('const district = firstRelatedRow(club.district);'), 'many-to-one district relation supports object responses'],
  [!query.includes('const club = item.club[0]'), 'club relation is not incorrectly assumed to be an array'],
  [query.includes("['gameyer-active-club-updates-v3']"), 'cache version is bumped after relation-shape fix'],
  [feed.includes("update.kind === 'offer' && update.ends_at === null"), 'UI detects ongoing offers explicitly'],
  [feed.includes('Davam edən təklif'), 'UI does not invent an offer expiry'],
  [feed.includes("trackPostHogEvent('club_update_impression'"), 'update impressions are measured'],
  [feed.includes("trackPostHogEvent('club_update_club_click'"), 'update-to-club transitions are measured'],
  [feed.includes("trackPostHogEvent('club_update_source_click'"), 'official-source clicks are measured'],
  [page.includes("description: 'GameYer-də klubların aktual turnir və təkliflərini bir yerdə kəşf et.'"), 'updates metadata uses natural customer-facing wording'],
  [page.includes('Klubların aktual turnir və təkliflərini bir yerdə kəşf et.'), 'updates hero uses natural customer-facing wording'],
  [!page.includes('Yalnız real klub və yoxlanmış mənbə ilə təsdiqlənmiş'), 'updates hero does not expose implementation-style verification caveats'],
  [page.includes('Yalnız aktual və yoxlanmış məlumatları göstəririk.'), 'empty state preserves truthful data wording without implementation-style copy'],
];

for (const [passed, message] of checks) {
  if (!passed) throw new Error(`club updates regression failed: ${message}`);
}

console.log(`club updates regression passed (${checks.length} checks)`);