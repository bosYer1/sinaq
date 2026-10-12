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


test('temporary Neon source enforces the least-privileged catalog role', async () => {
  const source = await readFile(new URL('../neon/emergency-catalog.ts', import.meta.url), 'utf8');
  assert.match(source, /url\.username !== 'gameyer_catalog_login'/);
  assert.match(source, /url\.pathname !== '\/gameyer'/);
  assert.match(source, /Emergency catalog connection must use the approved read-only role/);
});

test('salvaged club photos are real local media from approved catalog URLs', async () => {
  const restored = JSON.parse(await readFile(new URL('../../data/recovered-club-media.json', import.meta.url), 'utf8')) as Record<string, string>;
  const manifest = JSON.parse(await readFile(new URL('../../../scripts/recovery/public-media-manifest-20261012.json', import.meta.url), 'utf8')) as {
    media: Array<{ profile: string | null; images: string[] }>;
  };
  const approved = new Set(manifest.media.flatMap(item => [item.profile, ...item.images].filter((url): url is string => Boolean(url))));
  assert.ok(Object.keys(restored).length > 0, 'no real cached media recovered');
  for (const [source, local] of Object.entries(restored)) {
    assert.ok(approved.has(source), 'unapproved source image');
    assert.match(local, /^\/recovered-club-media\/[a-f0-9]{25}\.(jpg|png|webp)$/);
    const bytes = await readFile(new URL(`../../../public${local}`, import.meta.url));
    assert.ok(bytes.length >= 1200 && bytes.length <= 2_000_000, 'invalid recovered image length');
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    assert.ok(jpeg || png || webp, 'recovered photo is not binary image data');
  }
});
