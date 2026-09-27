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
  publicDataProxy,
  publicDataCanary,
  buildOidcCanary,
  packageJson,
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
  readFile(new URL('../supabase/functions/gameyer-public-data-proxy/index.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/api/security/public-data-canary/route.ts', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/vercel-oidc-build-canary.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../package.json', import.meta.url), 'utf8'),
]);

assert.match(publicServer, /import 'server-only';/, 'public data client wrapper must stay server-only');
assert.match(publicServer, /createServerDataClient/, 'public query modules must use the trusted server data client');
assert.doesNotMatch(publicServer, /SUPABASE_PUBLISHABLE_KEY/, 'public server query wrapper must not use the browser publishable key');

assert.match(serverData, /SUPABASE_SECRET_KEY/, 'server data client may use a direct Supabase secret when explicitly configured');
assert.match(serverData, /SUPABASE_SERVICE_ROLE_KEY/, 'server data client must retain service-role fallback compatibility');
assert.match(serverData, /VERCEL_OIDC_TOKEN/, 'production public reads must support Vercel OIDC without a long-lived Supabase secret');
assert.match(serverData, /gameyer-public-data-proxy/, 'production public reads must traverse the trusted Supabase Edge proxy');
assert.match(serverData, /import \{ headers \} from 'next\/headers';/, 'runtime trusted reads must use the request-scoped Vercel OIDC header');
assert.match(serverData, /headers\(\)\)\.get\('x-vercel-oidc-token'\)/, 'runtime trusted reads must consume x-vercel-oidc-token');
assert.match(serverData, /global:\s*\{\s*fetch:\s*trustedProxyFetch\(oidcToken\)\s*\}/, 'production publishable client must replace direct fetch with the trusted OIDC proxy');
assert.doesNotMatch(serverData, /GAMEYER_PUBLIC_DATA_OIDC_ENABLED/, 'trusted production reads must not depend on a manually forgotten rollout flag');

assert.doesNotMatch(clubLogo, /supabase\/client/, 'public ClubLogo must not import the browser Supabase client');
assert.doesNotMatch(clubLogo, /\.from\(['"]clubs['"]\)/, 'public ClubLogo must not read clubs directly from the browser');
assert.match(clubDetail, /profileImageUrl=\{club\.profile_image_url\}/, 'club detail must pass profile image data from the server-rendered club payload');

assert.match(clubUpdates, /createServerDataClient/, 'club updates must be loaded server-side');
assert.doesNotMatch(clubUpdates, /SUPABASE_PUBLISHABLE_KEY/, 'club updates query must not use the browser publishable key');
assert.match(clubUpdates, /const publicClubs = await getClubs\(\)/, 'club updates must derive visibility from the canonical public club query');
assert.match(clubUpdates, /\.in\('club_id', publicClubIds\)/, 'trusted club update reads must stay restricted to public club ids');
assert.doesNotMatch(clubs, /unstable_cache/, 'public club inventory must not persist empty results across OIDC request boundaries');
assert.doesNotMatch(clubUpdates, /unstable_cache/, 'club updates must not persist empty results across OIDC request boundaries');
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

for (const literal of [
  "VERCEL_ISSUER = 'https://oidc.vercel.com/gameyer'",
  "VERCEL_AUDIENCE = 'https://vercel.com/gameyer'",
  "VERCEL_SUBJECT = 'owner:gameyer:project:gameyer:environment:production'",
  "request.headers.get('x-gameyer-vercel-oidc')",
  "method !== 'GET' && method !== 'HEAD'",
  'ALLOWED_PATHS',
  'SUPABASE_SECRET_KEYS',
  'SUPABASE_SERVICE_ROLE_KEY',
]) {
  assert.ok(publicDataProxy.includes(literal), `trusted public data proxy must enforce ${literal}`);
}
assert.doesNotMatch(publicDataProxy, /Access-Control-Allow-Origin:\s*['"]\*['"]/, 'trusted public data proxy must not expose wildcard CORS');
assert.match(publicDataProxy, /target\.origin !== expectedOrigin/, 'proxy must reject off-project upstream origins');
assert.match(publicDataProxy, /!ALLOWED_PATHS\.has\(target\.pathname\)/, 'proxy must reject non-public-inventory REST paths');

assert.match(publicDataCanary, /requestVercelOidcToken\(request\)/, 'OIDC canary must use the request-scoped Vercel token at runtime');
assert.match(publicDataCanary, /gameyer-public-data-proxy/, 'OIDC canary must test the trusted public-data bridge');
assert.match(publicDataCanary, /public_clubs: publicCount/, 'OIDC canary must expose only the verified count, not raw club inventory');
assert.match(publicDataCanary, /x-robots-tag': 'noindex, nofollow'/, 'OIDC canary must stay out of search results');
assert.match(publicDataCanary, /VERCEL_ENV !== 'production'/, 'OIDC canary must not impersonate production trust in preview');
assert.match(buildOidcCanary, /VERCEL_OIDC_TOKEN/, 'production build canary must require the Vercel OIDC token');
assert.match(buildOidcCanary, /gameyer-public-data-proxy/, 'production build canary must exercise the trusted bridge before Next.js build');
assert.match(buildOidcCanary, /rows\.length < 1/, 'production build canary must fail closed when trusted data is empty');
assert.match(packageJson, /node scripts\/vercel-oidc-build-canary\.mjs && npm test && next build/, 'production build must run OIDC canary before Next.js renders cacheable pages');

assert.match(terms, /İstifadəçi razılaşması və istifadə qaydaları/i, 'usage terms must identify themselves as the user agreement');
assert.match(terms, /Qanunla məcburi qaydada icazə verilən hallar istisna olmaqla/i, 'usage terms must preserve mandatory legal exceptions');
assert.match(terms, /avtomatlaşdırılmış çıxarış/i, 'usage terms must disclose automated extraction restrictions');
assert.match(terms, /robot, scraper, crawler, headless browser/i, 'usage terms must explicitly cover common automated scraping methods');
assert.match(terms, /texniki mühafizə tədbirlərinin dolanılması/i, 'usage terms must prohibit bypassing technical safeguards');
assert.match(terms, /Axtarış sistemlərinin normal indeksləmə fəaliyyəti/i, 'usage terms must preserve legitimate search-engine indexing');
assert.match(terms, /ayrıca ictimai faktların/i, 'usage terms must not overclaim ownership of underlying public facts');
assert.match(terms, /qanunla məhdudlaşdırılması mümkün olmayan istehlakçı/i, 'usage terms must preserve mandatory consumer rights');
assert.match(rootLayout, /href="\/istifade-qaydalari"/, 'desktop footer must expose the usage terms');
assert.match(menuPage, /href: '\/istifade-qaydalari'/, 'mobile menu must expose the usage terms');

console.log('Public data anti-scrape regression contract: PASS');
