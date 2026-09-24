import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const clubs = await readFile(new URL('../src/lib/queries/clubs.ts', import.meta.url), 'utf8');
const detail = await readFile(new URL('../src/app/klub/[slug]/page.tsx', import.meta.url), 'utf8');

assert.ok(clubs.includes('phone, instagram_url, tiktok_url, profile_image_url'), 'Public club select must carry TikTok with the main club row');
assert.ok(clubs.includes('export async function getPublicClubCount'), 'Club detail local links must have a lightweight count helper');
const countStart = clubs.indexOf('async function queryPublicClubCount');
const countEnd = clubs.indexOf('const getCachedPublicClubCount', countStart);
const countBody = clubs.slice(countStart, countEnd);
assert.ok(!countBody.includes('getClubPopularityMetrics'), 'Count helper must not run popularity aggregation');
assert.ok(!countBody.includes('pricing:club_pricing'), 'Count helper must not load pricing');
assert.ok(!countBody.includes('images:club_images'), 'Count helper must not load images');
assert.ok(!detail.includes('getClubTikTokUrl'), 'Club detail must not run a second TikTok lookup');
assert.ok(detail.includes('club.tiktok_url?.trim() || null'), 'Club detail must use TikTok from the main club row');
assert.ok(detail.includes('getPublicClubCount({ district: districtSlug, type: type.slug })'), 'Local type links must use the lightweight count helper');

console.log('Runtime query regression: PASS');
