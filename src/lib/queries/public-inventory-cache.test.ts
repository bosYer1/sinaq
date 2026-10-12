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
