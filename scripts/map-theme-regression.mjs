import { readFile } from 'node:fs/promises';

const [preview, clubMap, exploreView, css] = await Promise.all([
  readFile(new URL('../src/components/map/MapPreview.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/map/ClubMap.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/explore/ExploreView.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/globals.css', import.meta.url), 'utf8'),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const osmHost = 'https://tile.openstreetmap.org/';
const darkFilter = 'filter: brightness(0.64) contrast(1.08) saturate(0.78);';

assert(preview.includes(osmHost), 'Map preview no longer uses the current OpenStreetMap provider.');
assert(clubMap.includes("const MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';"), 'Live map provider changed unexpectedly.');
assert(!preview.includes('basemaps.cartocdn.com'), 'Stale CARTO provider leaked back into MapPreview.');
assert(!clubMap.includes('basemaps.cartocdn.com'), 'Stale CARTO provider leaked back into ClubMap.');
assert(!preview.includes('dark:'), 'MapPreview must follow GameYer data-theme selectors, not Tailwind dark: variants.');

for (const className of [
  'gameyer-map-preview',
  'gameyer-map-preview-tiles',
  'gameyer-map-preview-wash',
  'gameyer-map-preview-attribution',
]) {
  assert(preview.includes(className), `MapPreview is missing ${className}.`);
}

assert(preview.includes('data-map-preview="current-clubs"'), 'MapPreview must remain identified as the current-club-data preview.');
assert(preview.includes('data-map-preview-marker-count'), 'MapPreview must expose the real positioned marker count.');
assert(preview.includes('projectToPreview(club.latitude, club.longitude)'), 'MapPreview markers must be projected from real club coordinates.');
assert(preview.includes("inferClubTypeSlugs(club)"), 'MapPreview marker types must come from real club type data.');
assert(!preview.includes('const markers = ['), 'Hard-coded decorative preview markers must not return.');
assert(exploreView.includes('<MapPreview clubs={clubsWithDistance} />'), 'Mobile list view must keep the current-data map preview before activation.');

assert(preview.includes('loading="eager"'), 'Visible preview tiles must remain eagerly discoverable for LCP.');
assert(preview.includes('fetchPriority="high"'), 'Visible preview tiles must retain high fetch priority for measured homepage LCP.');
assert(preview.includes('width={256}') && preview.includes('height={256}'), 'Preview tile intrinsic dimensions must remain explicit.');
assert(!preview.includes('backgroundImage:'), 'Preview tiles must not regress to CSS background requests that are discovered later.');

assert(css.includes("html[data-theme='dark'] .leaflet-tile-pane"), 'Live map dark-mode data-theme selector is missing.');
assert(css.includes("html[data-theme='dark'] .gameyer-map-preview-tiles"), 'Preview dark-mode data-theme selector is missing.');
assert(css.includes("html[data-theme='dark'] .gameyer-map-preview-attribution"), 'Preview attribution dark-mode selector is missing.');

const liveDarkRule = css.slice(css.indexOf("html[data-theme='dark'] .leaflet-tile-pane"));
const previewDarkRule = css.slice(css.indexOf("html[data-theme='dark'] .gameyer-map-preview-tiles"));
assert(liveDarkRule.includes(darkFilter), 'Live map dark filter changed or disappeared.');
assert(previewDarkRule.includes(darkFilter), 'Preview dark filter no longer matches the live map.');

console.log('Map theme regression checks passed.');
