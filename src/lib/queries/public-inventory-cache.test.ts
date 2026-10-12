import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  hasRequestIndependentPublicDataCredential,
  PUBLIC_INVENTORY_CACHE_SECONDS,
  normalizePublicSearchText,
  publicSearchTerms,
  filterPublicInventorySnapshot,
  type PublicInventoryFilter,
} from './public-inventory-cache.ts';

test('public inventory is cached for only five minutes', () => {
  assert.equal(PUBLIC_INVENTORY_CACHE_SECONDS, 300);
});

test('request-scoped Vercel OIDC must never be cached', () => {
  assert.equal(hasRequestIndependentPublicDataCredential({}), false);
  assert.equal(hasRequestIndependentPublicDataCredential({ VERCEL_ENV: 'production' }), false);
  assert.equal(hasRequestIndependentPublicDataCredential({ VERCEL_OIDC_TOKEN: '   ' }), false);
});

test('environment-scoped OIDC and server secrets allow cross-request caching', () => {
  for (const key of [
    'VERCEL_OIDC_TOKEN',
    'GAMEYER_CI_OIDC_TOKEN',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]) {
    assert.equal(hasRequestIndependentPublicDataCredential({ [key]: 'trusted' }), true, key);
  }
  assert.equal(hasRequestIndependentPublicDataCredential({
    ACTIONS_ID_TOKEN_REQUEST_URL: 'https://actions.example',
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'trusted',
  }), true);
  assert.equal(hasRequestIndependentPublicDataCredential({
    ACTIONS_ID_TOKEN_REQUEST_URL: 'https://actions.example',
  }), false);
});

test('shared public cache does not affect filtered queries or public eligibility gate', async () => {
  const source = await readFile(new URL('./clubs.ts', import.meta.url), 'utf8');
  assert.match(source, /const hasFilters = Boolean\(district \|\| metro \|\| type \|\| priceMax \|\| q\?\.trim\(\)\)/);
  assert.match(source, /if \(!hasFilters\) return getTrustedPublicClubs\(\);/);
  assert.match(source, /const trustedToken = await requestVercelPublicReadToken\(\);/);
  assert.match(source, /const clubs = await queryClubs\(\{\}, trustedToken\);/);
  assert.match(source, /\['gameyer-public-clubs-header-v1'\]/);
  assert.match(source, /return queryClubs\(\{ district, metro, type, priceMax, q \}\);/);
  assert.match(source, /\.eq\('is_active', true\)/);
  assert.match(source, /hasConfirmedPublicSocial\(club\)/);
  assert.match(source, /hasConfirmedPublicType\(club\)/);
  assert.match(source, /getSharedPublicClubs = unstable_cache/);
  assert.match(source, /const clubs = await getTrustedPublicClubs\(\);/);
  assert.match(source, /return clubs\.find\(\(club\) => club\.slug === slug\) \?\? null;/);
  assert.match(source, /return queryClubBySlug\(slug\);/);
  assert.match(source, /getSharedPublicClubCount = unstable_cache/);
  assert.doesNotMatch(source, /createBrowserClient|from '@\/lib\/supabase\/client'/);
});

type FixtureClub = {
  name: string;
  slug: string;
  address: string;
  district: { name: string; slug: string } | null;
  metros: readonly string[];
  types: readonly string[];
};

const discoveryFixtures: readonly FixtureClub[] = [
  {
    name: 'Alpha Arena',
    slug: 'alpha-arena',
    address: 'Sınaq küçəsi',
    district: { name: 'Əhmədli', slug: 'ehmedli' },
    metros: ['ehmedli'],
    types: ['pc', 'playstation'],
  },
  {
    name: 'Beta Computer',
    slug: 'beta-computer',
    address: 'Nümunə prospekti',
    district: { name: 'Nəsimi', slug: 'nesimi' },
    metros: ['28-may'],
    types: ['pc'],
  },
  {
    name: 'Gamma Console',
    slug: 'gamma-console',
    address: 'Digər küçə',
    district: { name: 'Əhmədli', slug: 'ehmedli' },
    metros: ['ehmedli'],
    types: ['playstation'],
  },
];

const fixtureHelpers = {
  matchesMetro: (club: FixtureClub, metro: string) => club.metros.includes(metro),
  inferTypeSlugs: (club: FixtureClub) => club.types,
};

const filterFixture = (filters: PublicInventoryFilter) =>
  filterPublicInventorySnapshot(discoveryFixtures, filters, fixtureHelpers).map((club) => club.slug);

test('snapshot filter respects district, metro and PC/PlayStation types', () => {
  assert.deepEqual(filterFixture({ district: 'ehmedli' }), ['alpha-arena', 'gamma-console']);
  assert.deepEqual(filterFixture({ metro: '28-may' }), ['beta-computer']);
  assert.deepEqual(filterFixture({ type: 'pc' }), ['alpha-arena', 'beta-computer']);
  assert.deepEqual(filterFixture({ type: 'ps' }), ['alpha-arena', 'gamma-console']);
  assert.deepEqual(filterFixture({ type: 'playstation', district: 'nesimi' }), []);
  assert.deepEqual(filterFixture({ type: 'pc', metro: 'ehmedli', district: 'ehmedli' }), ['alpha-arena']);
  assert.deepEqual(filterFixture({ district: 'missing' }), []);
});

test('snapshot search follows Azerbaijani normalization and all-term semantics', () => {
  assert.equal(normalizePublicSearchText('ƏHMƏDLİ m/s'), 'ehmedli metro');
  assert.deepEqual(publicSearchTerms('Əhmədli m/s'), ['ehmedli']);
  assert.deepEqual(publicSearchTerms('ms metro'), ['ms', 'metro']);
  assert.deepEqual(filterFixture({ q: 'alpha ƏHMƏDLİ m/s' }), ['alpha-arena']);
  assert.deepEqual(filterFixture({ q: 'BETA  nəsimi' }), ['beta-computer']);
  assert.deepEqual(filterFixture({ q: 'alpha gamma' }), []);
  assert.deepEqual(filterFixture({ q: 'metro' }), []);
  assert.deepEqual(filterFixture({ q: '   ' }), ['alpha-arena', 'beta-computer', 'gamma-console']);
});

test('snapshot filtering is stable, side-effect free and does not change unknown-filter behavior', () => {
  const originalOrder = discoveryFixtures.map((club) => club.slug);
  const original = filterPublicInventorySnapshot(discoveryFixtures, { type: 'playstation' }, fixtureHelpers);
  assert.equal(original[0], discoveryFixtures[0]);
  assert.equal(original[1], discoveryFixtures[2]);
  assert.deepEqual(discoveryFixtures.map((club) => club.slug), originalOrder);
  assert.deepEqual(filterFixture({ type: 'unknown' }), originalOrder);
});

test('price queries keep SQL join semantics; cache refuses unexpectedly empty inventories', async () => {
  const source = await readFile(new URL('./clubs.ts', import.meta.url), 'utf8');
  assert.match(source, /return filterPublicInventorySnapshot\(/);
  assert.match(source, /const clubs = await getTrustedPublicClubs\(\)/);
  assert.match(source, /if \(priceMax == null \|\| priceMax <= 0\)/);
  assert.match(source, /return queryClubs\(\{ district, metro, type, priceMax, q \}\);/);
  assert.match(source, /pricing:club_pricing!inner/);
  assert.match(source, /Refusing to cache an unexpectedly empty public club inventory/);
});

test('Neon recovery is opt-in, server-only and reads only approved catalog views', async () => {
  const [neon, clubs, districts, updates, sitemap, health] = await Promise.all([
    readFile(new URL('../neon/emergency-catalog.ts', import.meta.url), 'utf8'),
    readFile(new URL('./clubs.ts', import.meta.url), 'utf8'),
    readFile(new URL('./districts.ts', import.meta.url), 'utf8'),
    readFile(new URL('./club-updates.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../app/sitemap.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../app/api/health/route.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(neon, /import 'server-only'/);
  assert.match(neon, /GAMEYER_NEON_EMERGENCY_READS === '1'/);
  assert.match(neon, /GAMEYER_NEON_CATALOG_DATABASE_URL/);
  assert.match(neon, /SELECT club FROM gameyer_public\.club_catalog_v1/);
  assert.match(neon, /Emergency public catalog eligibility violation/);
  assert.doesNotMatch(neon, /\b(INSERT|UPDATE|DELETE|ALTER|TRUNCATE)\s+gameyer_/);
  assert.match(clubs, /if \(emergencyNeonCatalogEnabled\(\)\) return getEmergencyPublicClubs\(\);/);
  assert.match(clubs, /if \(emergencyNeonCatalogEnabled\(\)\) \{/);
  assert.match(districts, /getEmergencyDistricts\(\)/);
  assert.match(districts, /getEmergencyClubTypes\(\)/);
  assert.match(updates, /if \(emergencyNeonCatalogEnabled\(\)\) return \[\];/);
  assert.match(sitemap, /if \(emergencyNeonCatalogEnabled\(\)\)/);
  assert.match(health, /getEmergencyPublicClubs\(\)/);
});

test('emergency metrics do not write to quota-limited Supabase', async () => {
  for (const filename of ['visit', 'event']) {
    const route = await readFile(new URL(`../../app/api/analytics/${filename}/route.ts`, import.meta.url), 'utf8');
    assert.match(route, /if \(emergencyNeonCatalogEnabled\(\)\)/);
    assert.match(route, /'x-gameyer-analytics-write': 'disabled'/);
  }
});


test('diagnostic: exact original media and Vercel optimizer reachability', async () => {
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  const imageUrl = "https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/b21ba925-3267-42af-af2b-1377e7ddabd8/profile/1787338647118-cb216ec6-168b-4b34-94b8-4c2ba0f1b0f6.jpg";
  const encoded = encodeURIComponent(imageUrl);
  const probes = [
    ['supabase-original', imageUrl],
    ['image-optimized-96', `https://gameyer.az/_next/image?url=${encoded}&w=96&q=75`],
    ['image-optimized-256', `https://gameyer.az/_next/image?url=${encoded}&w=256&q=75`],
    ['image-optimized-640', `https://gameyer.az/_next/image?url=${encoded}&w=640&q=75`],
  ];
  for (const [name, url] of probes) {
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
      const bytes = (await response.arrayBuffer()).byteLength;
      console.log('MEDIA_PROBE', name, response.status, response.headers.get('content-type'), bytes);
    } catch (error) {
      console.log('MEDIA_PROBE', name, 'ERR', error instanceof Error ? error.message : String(error));
    }
  }
});

test('diagnostic: sample across clubs to locate existing image-cache copies', async () => {
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  const probes = [{"slug":"apex-cyber-arena","role":"profile","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/07d5bca0-23aa-4986-9fc8-534c0008d3ad/profile/1788113078091-e278309b-1b24-43e6-be42-54933f49180a.jpg"},{"slug":"apex-cyber-arena","role":"gallery","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/07d5bca0-23aa-4986-9fc8-534c0008d3ad/1788458941133-9fab0841-62e0-46b3-ae6b-3e83d55f9698.jpg"},{"slug":"colizeum-baku","role":"profile","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/c668810c-ff51-4b39-8816-c55935cb94f5/profile/1787342716342-b3708d84-88f1-488b-8ff1-db52304a8590.png"},{"slug":"colizeum-baku","role":"gallery","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/c668810c-ff51-4b39-8816-c55935cb94f5/1787342690556-78a73586-efd4-485d-a150-010dfc87c5a6.jpg"},{"slug":"cyber-arena-baku","role":"profile","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/c538f24b-2ee6-4ea3-9019-c8eb06b1be18/profile/1787503887230-389065a2-f04f-4645-b929-53ed07bfc68c.jpg"},{"slug":"cyber-arena-baku","role":"gallery","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/c538f24b-2ee6-4ea3-9019-c8eb06b1be18/1787504232603-bdd84303-0dc1-4e10-adf2-9980dcd6744e.jpg"},{"slug":"ibrazoro-cyber-zone-28-may","role":"profile","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/fe59a1dd-e8e7-411c-b8d3-ff046e78d5b6/profile/1787839395921-dc31a094-c337-4557-b6af-bd45f905d566.jpg"},{"slug":"ibrazoro-cyber-zone-28-may","role":"gallery","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/fe59a1dd-e8e7-411c-b8d3-ff046e78d5b6/1787839451204-7eefb539-7c6c-4337-a897-66b60f748086.jpg"},{"slug":"kenza-gaming-lounge","role":"profile","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/9ef04d30-12b0-48cf-97e1-dece015f4220/profile/1787336740887-a636e312-ae0e-4303-a0e4-bbed66fdc6d5.jpg"},{"slug":"kenza-gaming-lounge","role":"gallery","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/9ef04d30-12b0-48cf-97e1-dece015f4220/1787337014380-2e5896f3-1b28-42c2-8bf3-2ae362d42c08.jpg"},{"slug":"la-liga-game-center-nerimanov","role":"profile","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/83bf1398-2e0b-480e-a66e-c20673f125c7/profile/1787841013344-bf72d996-1d1e-4bc5-81de-49f675fc48f5.jpg"},{"slug":"milli-gaming-arena","role":"profile","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/1d0b68d6-d39a-4a8b-85a8-60c97171a89d/profile/1787320301757-b6b263b6-5c3d-41a8-9f15-dd35b7db9f03.jpg"},{"slug":"milli-gaming-arena","role":"gallery","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/1d0b68d6-d39a-4a8b-85a8-60c97171a89d/1787312039253-34b32580-1a69-43e2-91fa-9a7b05729815.jpg"},{"slug":"omg-cyber-zone","role":"profile","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/156c1441-a25d-4275-a704-0beb97dfffe6/profile/1787337938012-a7ac2220-846b-40c7-9464-c199e7165759.webp"},{"slug":"omg-cyber-zone","role":"gallery","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/156c1441-a25d-4275-a704-0beb97dfffe6/1787337794333-934a39c7-1894-446e-8c4d-089eef79813c.jpg"},{"slug":"prime-cyber-club","role":"profile","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/6d51fb48-1c63-4c43-ba21-b96223d9287d/profile/1788113794552-8a34ecdf-59b7-4b4a-8285-98605253dc68.jpg"},{"slug":"prime-cyber-club","role":"gallery","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/6d51fb48-1c63-4c43-ba21-b96223d9287d/1788113820559-28f30609-b06b-48eb-b566-69d0e0d0d2b6.jpg"},{"slug":"vegas-gaming-center-hazi-aslanov","role":"profile","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/b5fecdd9-72e2-45d9-aad7-74299c222efd/profile/1787840960701-54eca40b-f0cc-416d-91c8-a0d088e0726f.jpg"},{"slug":"vulpex-game-arena","role":"profile","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/81f37c7a-7330-4733-867f-761d7b052a60/profile/1789369789086-9f171e5e-0322-48d6-adcf-63d07ded2fe7.jpg"},{"slug":"vulpex-game-arena","role":"gallery","url":"https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/81f37c7a-7330-4733-867f-761d7b052a60/1789369808609-39ae6f68-e120-4def-9944-d63deec86a3a.jpg"}];
  const counts = { success: 0, unavailable: 0 };
  for (const entry of probes) {
    const url = `https://gameyer.az/_next/image?url=${encodeURIComponent(entry.url)}&w=${entry.role === 'gallery' ? 640 : 256}&q=75`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const bytes = (await response.arrayBuffer()).byteLength;
      const valid = response.ok && response.headers.get('content-type')?.startsWith('image/') && bytes > 1000;
      counts[valid ? 'success' : 'unavailable']++;
      console.log('SAMPLE_MEDIA', entry.slug, entry.role, response.status, bytes, valid ? 'OK' : 'MISSING');
    } catch (error) {
      counts.unavailable++;
      console.log('SAMPLE_MEDIA', entry.slug, entry.role, 'ERROR', error instanceof Error ? error.message : String(error));
    }
  }
  console.log('SAMPLE_MEDIA_TOTAL', counts);
});
