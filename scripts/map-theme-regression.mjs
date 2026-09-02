import { readFile } from 'node:fs/promises';

const [preview, clubMap, exploreView, viewport, css] = await Promise.all([
  readFile(new URL('../src/components/map/MapPreview.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/map/ClubMap.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/explore/ExploreView.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/mapViewport.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/globals.css', import.meta.url), 'utf8'),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const osmHost = 'https://tile.openstreetmap.org/';
const darkFilter = 'filter: brightness(0.64) contrast(1.08) saturate(0.78);';

assert(viewport.includes("export const MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';"), 'Shared map viewport no longer uses the current OpenStreetMap provider.');
assert(clubMap.includes('MAP_TILE_URL'), 'Live map no longer consumes the shared OpenStreetMap provider contract.');
assert(preview.includes('getOsmTileUrl('), 'Map preview no longer consumes the shared OpenStreetMap tile contract.');
assert(viewport.includes(osmHost), 'Shared map viewport lost the OpenStreetMap host.');
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
assert(preview.includes('data-map-preview-marker-count'), 'MapPreview must expose the real coordinate marker count.');
assert(preview.includes('getMappableCoordinates(clubs)'), 'MapPreview viewport must be derived from real club coordinates.');
assert(preview.includes('getMapViewport(coordinates, size.width, size.height)'), 'MapPreview must derive its viewport from the shared live-map contract.');
assert(preview.includes('projectMapCoordinate(club.latitude, club.longitude, viewport.zoom)'), 'MapPreview markers must be projected from real club coordinates at the shared viewport zoom.');
assert(preview.includes('inferClubTypeSlugs(club)'), 'MapPreview marker types must come from real club type data.');
assert(!preview.includes('const markers = ['), 'Hard-coded decorative preview markers must not return.');
assert(!preview.includes('TILE_X_START') && !preview.includes('TILE_Y_START'), 'Hard-coded preview tile coordinates must not return.');
assert(clubMap.includes('getMappableCoordinates(clubs)'), 'Live map must consume the same coordinate-selection contract as MapPreview.');
assert(clubMap.includes('MAP_FIT_PADDING') && clubMap.includes('MAP_MAX_FIT_ZOOM'), 'Live map fitBounds options must come from the shared viewport contract.');
assert(viewport.includes('MAP_FIT_PADDING = 36'), 'Shared viewport padding changed unexpectedly.');
assert(viewport.includes('MAP_MAX_FIT_ZOOM = 14'), 'Shared viewport max fit zoom changed unexpectedly.');
assert(exploreView.includes('<MapPreview clubs={clubsWithDistance} />'), 'Mobile list view must keep the current-data map preview before activation.');
assert(
  exploreView.includes('mobileListMapActive ? renderMapPanel() : <MapPreview clubs={clubsWithDistance} />'),
  'Mobile list view must defer the live Leaflet map until activation.',
);
assert(
  !exploreView.includes('isDesktop === false ? renderMapPanel() : <div className="h-full animate-pulse rounded-[18px] bg-surface-alt" />\n              {!mobileListMapActive ? ('),
  'Inactive mobile list mode must not render the live map behind the preview.',
);

assert(preview.includes('loading="eager"'), 'Visible preview tiles must remain eagerly discoverable for LCP.');
assert(preview.includes('fetchPriority="high"'), 'Visible preview tiles must retain high fetch priority for measured homepage LCP.');
assert(preview.includes('width={MAP_TILE_SIZE}') && preview.includes('height={MAP_TILE_SIZE}'), 'Preview tile intrinsic dimensions must remain explicit.');
assert(!preview.includes('backgroundImage:'), 'Preview tiles must not regress to CSS background requests that are discovered later.');

assert(css.includes("html[data-theme='dark'] .leaflet-tile-pane"), 'Live map dark-mode data-theme selector is missing.');
assert(css.includes("html[data-theme='dark'] .gameyer-map-preview-tiles"), 'Preview dark-mode data-theme selector is missing.');
assert(css.includes("html[data-theme='dark'] .gameyer-map-preview-attribution"), 'Preview attribution dark-mode selector is missing.');

const liveDarkRule = css.slice(css.indexOf("html[data-theme='dark'] .leaflet-tile-pane"));
const previewDarkRule = css.slice(css.indexOf("html[data-theme='dark'] .gameyer-map-preview-tiles"));
assert(liveDarkRule.includes(darkFilter), 'Live map dark filter changed or disappeared.');
assert(previewDarkRule.includes(darkFilter), 'Preview dark filter no longer matches the live map.');

console.log('Map theme regression checks passed.');
