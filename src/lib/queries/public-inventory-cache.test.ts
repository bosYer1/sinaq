import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  hasRequestIndependentPublicDataCredential,
  PUBLIC_INVENTORY_CACHE_SECONDS,
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
  assert.match(source, /if \(!hasFilters && hasRequestIndependentPublicDataCredential\(\)\)/);
  assert.match(source, /return queryClubs\(\{ district, metro, type, priceMax, q \}\);/);
  assert.match(source, /\.eq\('is_active', true\)/);
  assert.match(source, /hasConfirmedPublicSocial\(club\)/);
  assert.match(source, /hasConfirmedPublicType\(club\)/);
  assert.match(source, /getSharedPublicClubs = unstable_cache/);
  assert.match(source, /const clubs = await getSharedPublicClubs\(\);/);
  assert.match(source, /return clubs\.find\(\(club\) => club\.slug === slug\) \?\? null;/);
  assert.match(source, /return queryClubBySlug\(slug\);/);
  assert.match(source, /getSharedPublicClubCount = unstable_cache/);
  assert.doesNotMatch(source, /createBrowserClient|from '@\/lib\/supabase\/client'/);
});
