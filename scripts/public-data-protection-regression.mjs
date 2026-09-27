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
  ciWorkflow,
  responsiveWorkflow,
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
  readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/responsive.yml', import.meta.url), 'utf8'),
]);

assert.match(publicServer, /import 'server-only';/, 'public data client wrapper must stay server-only');
assert.match(publicServer, /createServerDataClient/, 'public query modules must use the trusted server data client');
assert.doesNotMatch(publicServer, /SUPABASE_PUBLISHABLE_KEY/, 'public server query wrapper must not use the browser publishable key');

assert.match(serverData, /SUPABASE_SECRET_KEY/, 'server data client may use a direct Supabase secret when explicitly configured');
assert.match(serverData, /SUPABASE_SERVICE_ROLE_KEY/, 'server data client must retain service-role fallback compatibility');
assert.match(serverData, /VERCEL_OIDC_TOKEN/, 'production public reads must support environment-scoped Vercel OIDC when available');
assert.match(serverData, /x-vercel-oidc-token/, 'production public reads must support request-scoped Vercel OIDC');
assert.match(serverData, /GAMEYER_CI_OIDC_TOKEN/, 'CI public reads must retain explicit GitHub Actions OIDC fallback support');
assert.match(serverData, /ACTIONS_ID_TOKEN_REQUEST_URL/, 'long-running CI must be able to mint fresh GitHub OIDC tokens at runtime');
assert.match(serverData, /ACTIONS_ID_TOKEN_REQUEST_TOKEN/, 'long-running CI must authenticate runtime OIDC mint requests');
assert.match(serverData, /GITHUB_OIDC_AUDIENCE/, 'runtime GitHub OIDC minting must use the locked GameYer audience');
assert.match(serverData, /x-gameyer-github-oidc/, 'CI must use a distinct GitHub OIDC proxy credential');
assert.match(serverData, /response\.status === 401/, 'CI must detect expired OIDC tokens');
assert.match(serverData, /requestScopedGitHubOidcToken\(true\)/, 'CI must force one OIDC refresh after an authenticated 401');
assert.match(serverData, /return fetch\(directRequest\)/, 'production canary must retain a direct RLS fallback until final cutover');
assert.match(serverData, /gameyer-public-data-proxy/, 'trusted public reads must traverse the Supabase Edge proxy');
assert.match(serverData, /global:\s*\{\s*fetch:\s*baseFetch\s*\}/, 'trusted publishable client must use the guarded OIDC-aware fetch path');

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

for (const literal of [
  "VERCEL_ISSUER = 'https://oidc.vercel.com/gameyer'",
  "VERCEL_AUDIENCE = 'https://vercel.com/gameyer'",
  "VERCEL_SUBJECT = 'owner:gameyer:project:gameyer:environment:production'",
  "request.headers.get('x-gameyer-vercel-oidc')",
  "request.headers.get('x-gameyer-github-oidc')",
  "GITHUB_ISSUER = 'https://token.actions.githubusercontent.com'",
  "GITHUB_AUDIENCE = 'https://gameyer.az/public-data-ci'",
  "GITHUB_REPOSITORY = 'bosYer1/sinaq'",
  "GITHUB_REPOSITORY_ID = '1332798813'",
  "GITHUB_TRUSTED_ACTOR_ID = '315903980'",
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
assert.match(publicDataProxy, /Boolean\(vercelToken\) === Boolean\(githubToken\)/, 'proxy must require exactly one trusted OIDC provider');
assert.match(publicDataProxy, /eventName === 'push' && ref !== 'refs\/heads\/main'/, 'GitHub push trust must be limited to main');
assert.match(publicDataProxy, /eventName === 'pull_request' && !\/\^refs\\\/pull\\\/\\d\+\\\/merge\$\//, 'GitHub pull-request trust must require the merge ref contract');

for (const workflow of [ciWorkflow, responsiveWorkflow]) {
  assert.match(workflow, /id-token:\s*write/, 'trusted DB workflows must request GitHub OIDC permission');
  assert.match(workflow, /core\.getIDToken\('https:\/\/gameyer\.az\/public-data-ci'\)/, 'trusted DB workflows must mint the locked audience token');
  assert.match(workflow, /core\.exportVariable\('GAMEYER_CI_OIDC_TOKEN', token\)/, 'trusted DB workflows must expose the masked OIDC token only to later job steps');
}

assert.match(terms, /avtomatlaşdırılmış çıxarış və kütləvi təkrar istifadə/i, 'usage terms must disclose automated extraction and reuse restrictions');
assert.match(terms, /robot, scraper, crawler, headless browser/i, 'usage terms must explicitly cover common automated scraping methods');
assert.match(terms, /texniki mühafizə tədbirlərinin dolanılması/i, 'usage terms must prohibit bypassing technical safeguards');
assert.match(terms, /məcburi qanunvericilik/i, 'usage terms must preserve mandatory legal rights and exceptions');
assert.match(terms, /ayrı-ayrı ictimai faktların/i, 'usage terms must not overclaim ownership over public facts or third-party materials');
assert.match(terms, /qanuni axtarış sistemi indekslənməsi/i, 'usage terms must preserve legitimate search-engine indexing');
assert.match(rootLayout, /href="\/istifade-qaydalari"/, 'desktop footer must expose the usage terms');
assert.match(menuPage, /href: '\/istifade-qaydalari'/, 'mobile menu must expose the usage terms');

console.log('Public data anti-scrape regression contract: PASS');
