import fs from 'node:fs';

const baseMigration = fs.readFileSync('supabase/migrations/20260909122500_add_club_updates.sql', 'utf8');
const ongoingMigration = fs.readFileSync('supabase/migrations/20260909170000_support_ongoing_club_offers.sql', 'utf8');
const query = fs.readFileSync('src/lib/queries/club-updates.ts', 'utf8');
const feed = fs.readFileSync('src/components/growth/ClubUpdatesFeed.tsx', 'utf8');
const page = fs.readFileSync('src/app/yenilikler/page.tsx', 'utf8');
const home = fs.readFileSync('src/app/page.tsx', 'utf8');

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
  [query.includes('profile_image_url'), 'update query carries profile images server-side instead of adding client fetches'],
  [query.includes("['gameyer-active-club-updates-v4']"), 'cache version is bumped after mobile offer performance fix'],
  [feed.includes("update.kind === 'offer' && update.ends_at === null"), 'UI detects ongoing offers explicitly'],
  [feed.includes('Davam edən təklif'), 'UI does not invent an offer expiry'],
  [feed.includes("trackPostHogEvent('club_update_impression'"), 'update impressions are measured'],
  [feed.includes('IntersectionObserver'), 'update impressions require viewport visibility instead of component mount'],
  [feed.includes("data-update-impression-id"), 'update cards expose an observation target for truthful impressions'],
  [feed.includes('snap-x snap-proximity'), 'mobile home preview scrolls horizontally without mandatory snap locking'],
  [feed.includes('overflow-x-auto'), 'mobile users can freely swipe through every bounded offer card'],
  [feed.includes('w-[228px]'), 'mobile home offer cards stay compact instead of taking most of the viewport'],
  [feed.includes('profileImageUrl={update.club.profile_image_url}'), 'mobile offers avoid per-card profile-image database fetches'],
  [!feed.includes("hidden sm:grid"), 'mobile home preview does not hide later offer cards'],
  [feed.includes("trackPostHogEvent('club_update_club_click'"), 'update-to-club transitions are measured'],
  [feed.includes("trackPostHogEvent('club_update_source_click'"), 'official-source clicks are measured'],
  [feed.includes("const isUpdatesPage = pathname === '/yenilikler'"), 'dedicated updates redesign stays scoped to the updates page'],
  [feed.includes('aria-label="Yenilik filtrləri"'), 'updates page exposes accessible filter controls'],
  [feed.includes("{ value: 'offer', label: 'Təkliflər'"), 'updates page can filter offers'],
  [feed.includes("{ value: 'tournament', label: 'Turnirlər'"), 'updates page can filter tournaments'],
  [!feed.includes("{ value: 'active', label: 'Aktiv'"), 'updates page omits the redundant Active filter'],
  [feed.includes('grid-cols-[112px_minmax(0,1fr)]'), 'updates cards keep a visual-first mobile layout'],
  [feed.includes('line-clamp-2'), 'updates cards keep long customer copy visually bounded'],
  [feed.includes('shadow-[0_8px_28px_rgba(31,35,48,0.06)]'), 'updates cards use the premium soft-elevation treatment'],
  [home.includes('sm:rounded-2xl sm:border sm:border-primary/15'), 'large framed updates block is desktop-only'],
  [home.includes('🔥 Təkliflər'), 'mobile home uses a compact Wolt-style offers heading'],
  [home.includes('updates={activeUpdates}'), 'home renders every active update across breakpoints'],
  [!home.includes('activeUpdates.slice(0, 3)'), 'home does not reintroduce the three-item update limit'],
  [page.includes("description: 'GameYer-də klubların aktual turnir və təkliflərini bir yerdə kəşf et.'"), 'updates metadata uses natural customer-facing wording'],
  [page.includes('Klubların aktual təklif və turnirlərini bir yerdə kəşf et.'), 'updates hero uses the polished customer-facing wording'],
  [page.includes('{updates.length} aktiv yenilik'), 'updates hero surfaces the verified active-update count'],
  [page.includes('rounded-[28px]'), 'updates hero uses the modern rounded visual system'],
  [!page.includes('Yalnız real klub və yoxlanmış mənbə ilə təsdiqlənmiş'), 'updates hero does not expose implementation-style verification caveats'],
  [page.includes('Yalnız aktual və yoxlanmış məlumatları göstəririk.'), 'empty state preserves truthful data wording without implementation-style copy'],
];

for (const [passed, message] of checks) {
  if (!passed) throw new Error(`club updates regression failed: ${message}`);
}

console.log(`club updates regression passed (${checks.length} checks)`);
