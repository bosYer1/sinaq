import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [
  publicServer,
  serverData,
  clubLogo,
  clubDetail,
  clubUpdates,
  clubs,
  clubSocial,
  sitemap,
  health,
  submissions,
  migration,
  terms,
  rootLayout,
  menuPage,
] = await Promise.all([
  readFile(new URL('../src/lib/supabase/public-server.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/supabase/server-data.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/clubs/ClubLogo.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/clubs/ClubDetail.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/queries/club-updates.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/queries/clubs.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/queries/club-social.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/sitemap.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/api/health/route.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/submissions/actions.ts', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/migrations/20260927122500_server_only_public_club_reads.sql', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/istifade-qaydalari/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/layout.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/menyu/page.tsx', import.meta.url), 'utf8'),
]);

assert.match(publicServer, /import 'server-only';/, 'public data client wrapper must stay server-only');
assert.match(publicServer, /createServerDataClient/, 'public query modules must use the trusted server data client');
assert.doesNotMatch(publicServer, /SUPABASE_PUBLISHABLE_KEY/, 'public server query wrapper must not use the browser publishable key');

assert.match(serverData, /SUPABASE_SECRET_KEY/, 'server data client must prefer the Supabase secret key');
assert.match(serverData, /SUPABASE_SERVICE_ROLE_KEY/, 'server data client must retain service-role fallback compatibility');
assert.match(serverData, /VERCEL_ENV !== 'production'/, 'publishable-key fallback must be forbidden in production');

assert.doesNotMatch(clubLogo, /supabase\/client/, 'public ClubLogo must not import the browser Supabase client');
assert.doesNotMatch(clubLogo, /\.from\(['"]clubs['"]\)/, 'public ClubLogo must not read clubs directly from the browser');
assert.match(clubDetail, /profileImageUrl=\{club\.profile_image_url\}/, 'club detail must pass profile image data from the server-rendered club payload');

assert.match(clubUpdates, /createServerDataClient/, 'club updates must be loaded server-side');
assert.doesNotMatch(clubUpdates, /SUPABASE_PUBLISHABLE_KEY/, 'club updates query must not use the browser publishable key');
assert.match(clubUpdates, /const publicClubs = await getClubs\(\)/, 'club updates must derive visibility from the canonical public club query');
assert.match(clubUpdates, /\.in\('club_id', publicClubIds\)/, 'server-secret club update reads must stay restricted to public club ids');
assert.match(sitemap, /createServerDataClient/, 'sitemap inventory reads must be server-only');
assert.match(health, /createServerDataClient/, 'health inventory reads must be server-only');
assert.match(submissions, /getClubBySlug/, 'public submission club lookup must reuse the canonical public club visibility query');
assert.doesNotMatch(submissions, /createServerDataClient/, 'submission code must not bypass canonical public club visibility directly');

for (const table of [
  'clubs',
  'club_pricing',
  'club_opening_hours',
  'club_images',
  'club_type_assignments',
  'club_types',
  'districts',
  'club_updates',
]) {
  assert.match(
    migration,
    new RegExp(`revoke\\s+select\\s+on\\s+table\\s+public\\.${table}\\s+from\\s+anon`, 'i'),
    `anon SELECT must be revoked from ${table}`,
  );
}

assert.doesNotMatch(
  migration,
  /revoke\s+select\s+on\s+table\s+public\.[a-z_]+\s+from\s+authenticated/i,
  'authenticated SELECT grants must remain available for RLS-protected admins',
);
assert.match(migration, /authenticated_admin_read_clubs/, 'clubs must retain an authenticated admin-only SELECT policy');
assert.match(migration, /authenticated_admin_read_club_updates/, 'club updates must retain an authenticated admin-only SELECT policy');
assert.match(migration, /revoke execute on function app_private\.is_public_club\(uuid\) from anon, authenticated;/i, 'legacy public visibility RPC must be closed after public RLS removal');

assert.match(terms, /avtomatlaşdırılmış məlumat çıxarılması/i, 'usage terms must disclose automated extraction restrictions');
assert.match(terms, /robot, scraper, crawler, headless browser/i, 'usage terms must explicitly cover common automated scraping methods');
assert.match(terms, /texniki mühafizə tədbirlərinin dolanılması/i, 'usage terms must prohibit bypassing technical safeguards');
assert.match(terms, /Axtarış sistemlərinin qanuni və normal indeksləmə fəaliyyəti/i, 'usage terms must preserve legitimate search-engine indexing');
assert.match(rootLayout, /href="\/istifade-qaydalari"/, 'desktop footer must expose the usage terms');
assert.match(menuPage, /href: '\/istifade-qaydalari'/, 'mobile menu must expose the usage terms');

console.log('Public data anti-scrape regression contract: PASS');
