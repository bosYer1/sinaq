import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/explore/ExploreView.tsx', import.meta.url), 'utf8');

assert.match(source, /aria-label=\{mapLocationLabel\}/, 'Map location control must expose its current state as an accessible label');
assert.match(source, /<span>\{mapLocationLabel\}<\/span>/, 'Map location label must remain visibly rendered on mobile');
assert.doesNotMatch(source, /hidden xl:inline[^\n]*\{mapLocationLabel\}/, 'Map location feedback must not be hidden until desktop widths');
assert.match(source, /data-map-location-message="true"/, 'Map panel must render inline geolocation failure guidance');
assert.match(source, /brauzer ayarlarında GameYer üçün lokasiya icazəsini aktiv et/, 'Denied geolocation guidance must tell users how to recover');

console.log('Location feedback regression: PASS');
