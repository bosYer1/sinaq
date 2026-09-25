import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [metro, filterBar, metroFilter, hooks, home, clubs, types, search, posthog] = await Promise.all([
  readFile(new URL('../src/lib/metro.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/filters/FilterBar.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/filters/MetroFilter.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/hooks/useFilters.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/queries/clubs.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/types/database.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/filters/SearchFilter.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/founder-analytics/posthog-server.ts', import.meta.url), 'utf8'),
]);

assert.match(types, /metro\?: string/, 'ClubFilters must carry the metro slug.');
assert.match(metro, /METRO_FILTER_RADIUS_KM = 2/, 'Metro matching must use an explicit bounded radius.');
assert.match(metro, /getNearestMetroStation/, 'Metro filtering must derive the nearest station from real club coordinates.');
assert.match(metro, /28 May \/ Cəfər Cabbarlı/, 'Co-located 28 May and Cəfər Cabbarlı must be one user-facing metro option.');
assert.doesNotMatch(metro, /Məhəmməd Hadi/, 'A street/exit label must not be exposed as an operating metro station.');
assert.match(metro, /getAvailableMetroStations/, 'Only metro stations with current public-club coverage should be shown.');
assert.match(clubs, /clubMatchesMetro\(club, filters\.metro!\)/, 'Server club results must honor the selected metro.');
assert.match(filterBar, /<MetroFilter stations=\{metroStations\}/, 'The main filter row must expose metro filtering.');
assert.match(metroFilter, /aria-label="Metroya görə filtr"/, 'Metro filter must be accessible in Azerbaijani.');
assert.match(hooks, /filter_name: 'metro'/, 'Metro filter changes must be tracked.');
assert.match(hooks, /had_metro/, 'Filter-clear analytics must preserve metro context.');
assert.match(home, /metroStations=\{activeMetroStations\}/, 'Homepage must supply only active metro options.');
assert.match(search, /metro: params\.get\('metro'\)/, 'Search analytics must preserve metro context.');
assert.match(posthog, /properties\.filter_name IN \('district','metro','club_type','price_max'\)/, 'Founder filter adoption must count metro usage.');

console.log('Metro filter regression checks passed.');
