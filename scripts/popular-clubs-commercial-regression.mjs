import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [clubs, popularity, popularPage, layout, tip, card, detail, sitemap] = await Promise.all([
  readFile(new URL('../src/lib/queries/clubs.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/queries/club-popularity.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/populyar-klublar/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/layout.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/tip/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/clubs/ClubCard.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/clubs/ClubDetail.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/sitemap.ts', import.meta.url), 'utf8'),
]);

assert.ok(popularity.includes("from('page_views')"), 'Popularity must derive from first-party club profile views.');
assert.ok(popularity.includes("select('path,session_id,user_agent')") && popularity.includes('SYNTHETIC_USER_AGENT_RE.test'), 'First-party popularity must exclude synthetic/bot-like traffic.');
assert.ok(popularity.includes("new Set<string>()"), 'Popularity must retain unique-session data as a tie-breaker.');
assert.ok(popularity.includes("revalidate: 600"), 'Popularity reads must be cached to avoid per-request analytics load.');

const premiumIndex = clubs.indexOf('const premiumDelta');
const profileImageIndex = clubs.indexOf('const profileImageDelta');
const viewIndex = clubs.indexOf('const viewDelta');
const sessionIndex = clubs.indexOf('const sessionDelta');
assert.ok(premiumIndex >= 0 && profileImageIndex > premiumIndex && viewIndex > profileImageIndex && sessionIndex > viewIndex, 'Commercial list order must pin Premium first, then require a complete profile card before organic view/session ranking.');
assert.ok(clubs.includes('bPopularity?.sessions') && clubs.includes('bPopularity?.views'), 'Default list must rank non-Premium clubs by 30-day demand.');

assert.ok(popularPage.includes('Premium status bu səhifədə orqanik sıralamaya təsir etmir.'), 'Organic popular page must disclose Premium neutrality.');
assert.ok(popularPage.includes('(b.metric?.views ?? 0) - (a.metric?.views ?? 0)') && popularPage.indexOf('(b.metric?.views ?? 0)') < popularPage.indexOf('(b.metric?.sessions ?? 0)'), 'Popular page must rank organically by 30-day profile views first.');
assert.ok(layout.includes('href="/populyar-klublar"'), 'Desktop/footer navigation must expose popular clubs.');
assert.ok(tip.includes('href="/populyar-klublar"'), 'Mobile menu destination must expose popular clubs.');
assert.ok(sitemap.includes('/populyar-klublar'), 'Popular clubs page must be discoverable in sitemap.');
assert.ok(card.includes('<Badge tone="premium">Premium</Badge>'), 'Club cards must label paid placement as Premium.');
assert.ok(detail.includes('<Badge tone="premium">Premium</Badge>'), 'Club detail must label paid placement as Premium.');
assert.ok(!card.includes('<Badge tone="premium">VIP</Badge>') && !detail.includes('<Badge tone="premium">VIP</Badge>'), 'Legacy VIP wording must not remain on public club surfaces.');

console.log('Premium placement + organic popularity regression: PASS');

assert.ok(popularity.includes('queryPostHogPopularity'), 'Popularity must have a PostHog fallback when server-admin page_views access is unavailable.');
assert.ok(popularity.includes("event = 'club_view'"), 'PostHog fallback must use real club profile views.');
assert.ok(popularity.includes("['gameyer-club-popularity-30d-v3']"), 'Popularity cache key must be bumped when traffic-quality semantics change.');
assert.ok(clubs.includes("['gameyer-public-clubs-v6']"), 'Public club cache key must be bumped for profile-image discovery ranking semantics.');
assert.ok(clubs.includes('const profileImageDelta') && clubs.includes('profile_image_url?.trim()'), 'Incomplete discovery cards must rank below clubs with a real profile image.');
assert.ok(clubs.includes('const recencyDelta'), 'Alphabetical ordering must not be the default fallback when popularity data ties or is unavailable.');
