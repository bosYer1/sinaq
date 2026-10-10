import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [list, tracked] = await Promise.all([
  readFile(new URL('../src/components/seo/SeoClubList.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/seo/TrackedSeoClubLink.tsx', import.meta.url), 'utf8'),
]);

assert.ok(list.includes('TrackedSeoClubLink'), 'SEO club lists must use the measured club-profile link wrapper.');
assert.ok(list.includes('data-seo-club-cta="true"'), 'SEO club cards must expose a visible selection cue.');
assert.ok(list.includes('Klub profilinə bax →'), 'SEO club cards must tell users the next action explicitly.');
assert.ok(list.includes('listPosition={index + 1}'), 'SEO club click analytics must retain list position.');

for (const token of [
  "trackGaEvent('club_card_click'",
  "trackPostHogEvent('club_card_click'",
  'clubCardClickEvent({',
  "sourceSurface: 'seo_landing'",
  'landingPath: window.location.pathname',
  'listPosition,',
  "source_surface: 'seo_landing'",
  "discovery_surface: 'seo_landing'",
  'landing_path: window.location.pathname',
  'rememberClubEntryOrigin(clubSlug)',
  'prefetch={false}',
  "transport: 'sendBeacon'",
]) {
  assert.ok(tracked.includes(token), `Tracked SEO club links must keep ${token}`);
}

for (const route of ['bakida-internet-klublari', 'bakida-playstation-klublari']) {
  const page = await readFile(new URL(`../src/app/${route}/page.tsx`, import.meta.url), 'utf8');
  const clubList = page.indexOf('<SeoClubList clubs={clubs} />');
  const brandLinks = page.indexOf('{brandNetworks.length > 0 ? (');
  assert.ok(clubList > 0 && brandLinks > 0 && clubList < brandLinks, `${route} must present actual club results before directory/brand navigation.`);
}
const nightLanding = await readFile(new URL('../src/app/bakida-24-saat-gaming-klublari/page.tsx', import.meta.url), 'utf8');
assert.ok(nightLanding.indexOf('id="night-clubs"') < nightLanding.indexOf('aria-labelledby="night-districts"'), '24-hour club results must appear before district navigation.');
console.log('SEO landing club conversion regression: PASS');
