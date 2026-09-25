import { readFile } from 'node:fs/promises';

const [recentLib, recentUi, tracker, home] = await Promise.all([
  readFile(new URL('../src/lib/recent-clubs.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/growth/RecentlyViewedClubs.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/analytics/ClubViewTracker.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8'),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(recentLib.includes("const RECENT_CLUBS_KEY = 'gameyer:recent-clubs-v1';"), 'Recent-club history must use an explicit versioned local key.');
assert(recentLib.includes('const RECENT_CLUB_LIMIT = 4;'), 'Recent-club history must stay compact.');
assert(recentLib.includes('const RECENT_CLUB_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;'), 'Recent-club history must expire stale entries after thirty days.');
assert(recentLib.includes("...existing.filter((entry) => entry.slug !== slug)"), 'Repeated club views must refresh rather than duplicate history entries.');
assert(recentLib.includes('window.localStorage.setItem(RECENT_CLUBS_KEY'), 'Recent history must remain browser-local and require no account or DB write.');

assert(tracker.includes('rememberRecentClub({'), 'A real club detail view must update recent-club history.');
assert(tracker.includes('slug: club.clubSlug') && tracker.includes('name: club.clubName'), 'Recent history must preserve stable club identity and display name.');

assert(home.includes("import { RecentlyViewedClubs }"), 'Homepage must load the return shortcut.');
assert(home.includes('<RecentlyViewedClubs') && home.includes('clubs={discoveryClubs.map((club) => ({'), 'Homepage must restrict recent history to currently public clubs.');
assert(home.indexOf('<RecentlyViewedClubs') < home.indexOf('{activeUpdates.length > 0 ? ('), 'Recent continuity must appear before the optional offers feed.');

assert(recentUi.includes('clubsBySlug.get(entry.slug)'), 'Recent history must ignore clubs that are no longer in current public inventory.');
assert(recentUi.includes("trackPostHogEvent('recent_clubs_impression'"), 'Recent-club exposure must be measurable.');
assert(recentUi.includes("trackPostHogEvent('recent_club_click'"), 'Recent-club return clicks must be measurable.');
assert(recentUi.includes("surface: 'home_recently_viewed'"), 'Recent-club analytics must use a stable surface identifier.');
assert(recentUi.includes('rememberClubEntryOrigin(club.slug)'), 'Recent-club navigation must preserve the existing return-to-list behavior.');
assert(recentUi.includes('prefetch={false}'), 'Recent-club links must avoid adding mobile viewport prefetch work.');

console.log('Recent clubs regression checks passed.');
