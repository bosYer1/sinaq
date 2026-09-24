import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [analytics, explore, clubMap, mapPreview, home] = await Promise.all([
  readFile(new URL('../src/components/analytics/PostHogAnalytics.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/explore/ExploreView.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/map/ClubMap.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/map/MapPreview.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8'),
]);

assert.ok(explore.includes("trackPostHogEvent('mobile_map_preview_activated'"), 'Mobile map preview activation must be captured directly');
assert.ok(explore.includes("trackPostHogEvent('mobile_more_clubs_clicked'"), 'Mobile list toggle must be captured directly');
assert.ok(explore.includes("action: nextExpanded ? 'expand' : 'collapse'"), 'Expand/collapse semantics must follow the next state');
assert.ok(!analytics.includes("'mobile_map_preview_activated'"), 'Delegated analytics must not double-capture map preview activation');
assert.ok(!analytics.includes("'mobile_more_clubs_clicked'"), 'Delegated analytics must not infer expand/collapse from mutable button text');
assert.ok(!explore.includes('const needsMobileExpansion ='), 'Marker selection must not auto-expand or drag the user into the mobile list.');
assert.ok(explore.includes('h-[340px]') && explore.includes('sm:h-[400px]'), 'Mobile map preview must keep the original map-first size.');
assert.ok(mapPreview.includes('const INITIAL_PREVIEW_SIZE: PreviewSize = { width: 390, height: 340 };'), 'Map preview first paint must preserve the original 340px viewport.');

for (const event of ['location_sort_clicked', 'map_location_clicked', 'home_club_jump_clicked']) {
  assert.ok(analytics.includes(`'${event}'`), `${event} must stay wired to PostHog`);
}
assert.ok(analytics.includes("document.addEventListener('click', onDocumentClick)"), 'Remaining discovery controls keep delegated tracking');
assert.ok(analytics.includes("document.removeEventListener('click', onDocumentClick)"), 'Delegated listener must be cleaned up');

for (const uiContract of [
  'data-mobile-list-map-container="true"',
  'aria-label="Xəritəni aktiv et"',
  'Daha çox klub göstər',
  'Daha az klub göstər',
  'Yaxınlığıma görə',
]) {
  assert.ok(explore.includes(uiContract), `ExploreView must keep analytics UI contract: ${uiContract}`);
}
assert.ok(home.includes('id="club-search"'), 'Homepage search anchor must remain stable');
assert.ok(home.includes('id="club-discovery"'), 'Homepage club discovery anchor must remain stable');
assert.ok(home.includes('ClubUpdatesFeed'), 'Homepage offers feed must remain present while filter controls stay discovery-focused.');
assert.ok(home.includes('data-home-club-jump="true"'), 'Homepage must keep the direct club discovery jump measurable.');
assert.ok(home.includes('{clubs.length} klub ↓'), 'Homepage discovery jump must reflect the active result count.');
assert.ok(clubMap.includes("trackPostHogEvent('club_card_click'"), 'Map popup club opens must stay measurable');
assert.ok(clubMap.includes("discovery_surface: 'map_popup'"), 'Map popup clicks must preserve their discovery surface');
assert.ok(clubMap.includes("transport: 'sendBeacon'"), 'Map popup navigation tracking must use unload-safe transport');
assert.ok(clubMap.includes("detailsLink.textContent = 'Kluba bax'"), 'Map popup must keep direct club-detail navigation.');
assert.ok(clubMap.includes("routeLink.textContent = 'Google Maps'"), 'Map popup must keep direct route navigation.');
assert.ok(clubMap.includes('https://www.google.com/maps/dir/?api=1&destination='), 'Map route action must open directions for the selected club.');

console.log('Discovery controls analytics regression: PASS');
