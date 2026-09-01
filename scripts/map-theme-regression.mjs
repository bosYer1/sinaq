import { readFile } from 'node:fs/promises';

const [clubMap, exploreView, css] = await Promise.all([
  readFile(new URL('../src/components/map/ClubMap.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/explore/ExploreView.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/globals.css', import.meta.url), 'utf8'),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const darkFilter = 'filter: brightness(0.64) contrast(1.08) saturate(0.78);';

assert(clubMap.includes("const MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';"), 'Live map provider changed unexpectedly.');
assert(!clubMap.includes('basemaps.cartocdn.com'), 'Stale CARTO provider leaked back into ClubMap.');
assert(!exploreView.includes('MapPreview'), 'Static MapPreview must not return to the mobile list view.');
assert(!exploreView.includes('mobileListMapActive'), 'Tap-to-replace preview state must not return.');
assert(
  exploreView.includes("{isDesktop === false ? renderMapPanel() : <div className=\"h-full animate-pulse rounded-[18px] bg-surface-alt\" />}"),
  'Mobile list view must render the existing live Leaflet map directly.',
);

assert(css.includes("html[data-theme='dark'] .leaflet-tile-pane"), 'Live map dark-mode data-theme selector is missing.');
const liveDarkRule = css.slice(css.indexOf("html[data-theme='dark'] .leaflet-tile-pane"));
assert(liveDarkRule.includes(darkFilter), 'Live map dark filter changed or disappeared.');

console.log('Map theme regression checks passed.');
