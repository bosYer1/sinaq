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
