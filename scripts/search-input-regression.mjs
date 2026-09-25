import { readFile } from 'node:fs/promises';

const [filterBar, searchFilter, typeFilter, exploreView, clubsQuery] = await Promise.all([
  readFile(new URL('../src/components/filters/FilterBar.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/filters/SearchFilter.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/filters/TypeFilter.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/explore/ExploreView.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/queries/clubs.ts', import.meta.url), 'utf8'),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!filterBar.includes('<SearchFilter key={searchQuery} />'), 'SearchFilter must not remount whenever the q parameter changes.');
assert(filterBar.includes('<SearchFilter />'), 'FilterBar must render a stable SearchFilter instance.');
assert(!filterBar.includes('🔥 Təkliflər'), 'Mobile filter row must stay focused on search/filter controls; offers remain in the homepage offers section.');
assert(filterBar.indexOf('Aktiv axtarış və filtrləri təmizlə') < filterBar.indexOf('<TypeFilter types={types} />'), 'Mobile clear action must appear before overflow-prone type/district/price controls.');
assert(typeFilter.includes('<span className="sm:hidden">PS</span>'), 'Mobile PlayStation filter must use the compact PS label.');
assert(typeFilter.includes('<span className="hidden sm:inline">{t.name}</span>'), 'Larger screens must retain the full PlayStation label.');
assert(typeFilter.includes('aria-label={t.name}'), 'Compact mobile filter labels must preserve the full accessible name.');
assert(searchFilter.includes('lastRequestedQueryRef'), 'SearchFilter must preserve local typing while URL navigation catches up.');
assert(searchFilter.includes('lastTrackedQueryRef'), 'Search analytics must deduplicate settled queries independently from URL navigation.');
assert(searchFilter.includes('currentQueryRef'), 'SearchFilter must track the latest committed query without restarting the typing debounce.');
assert(searchFilter.includes('paramsStringRef'), 'SearchFilter must preserve the latest URL parameters without making them debounce dependencies.');
assert(searchFilter.includes('pendingSearchAnalytics'), 'Search analytics must wait for committed result state before capture.');
assert(searchFilter.includes('readRenderedResultCount'), 'Search analytics must read the committed rendered result count.');
assert(searchFilter.includes("getAttribute('data-result-count')"), 'Search result count must use a stable data contract instead of visible copy.');
assert(exploreView.includes('data-result-count={clubsWithDistance.length}'), 'Discovery must expose the stable committed result count contract.');
assert(searchFilter.includes('result_count: resultCount'), 'search_query must include committed result_count.');
assert(searchFilter.includes('no_results: resultCount === 0'), 'search_query must include derived no_results.');
assert(searchFilter.includes('const currentQueryAtDispatch = currentQueryRef.current;'), 'Search dispatch must compare against the latest committed query at timer execution time.');
assert(searchFilter.includes('nextQuery === lastRequestedQueryRef.current'), 'Search dispatch must deduplicate an already requested final query.');
assert(searchFilter.includes('const SEARCH_NAVIGATION_DEBOUNCE_MS = 300;'), 'Search result navigation must keep the responsive 300ms debounce.');
assert(searchFilter.includes('const SEARCH_ANALYTICS_SETTLE_MS = 1200;'), 'Search intent analytics must wait for a settled query instead of mirroring navigation debounce.');
assert(searchFilter.includes('const SEARCH_RESULT_READ_INTERVAL_MS = 100;'), 'Committed search-result polling must use a bounded low-frequency retry interval.');
assert(searchFilter.includes('const SEARCH_RESULT_READ_TIMEOUT_MS = 10_000;'), 'Committed search-result polling must tolerate slow route/data commits before giving up.');
assert(searchFilter.includes('Date.now() - startedAt < SEARCH_RESULT_READ_TIMEOUT_MS'), 'Search analytics retry must be time-bounded rather than frame-count bounded.');
assert(searchFilter.includes('window.setTimeout(captureCommittedSearch, SEARCH_RESULT_READ_INTERVAL_MS)'), 'Search analytics must retry result reads while the committed UI is still settling.');
assert(searchFilter.includes('window.clearTimeout(retryTimer)'), 'Search analytics retry timer must be cleaned up on effect cancellation.');
assert(!searchFilter.includes('SEARCH_RESULT_READ_ATTEMPTS'), 'Search analytics must not use the old ~30-frame retry budget.');
assert(searchFilter.includes('}, SEARCH_NAVIGATION_DEBOUNCE_MS);'), 'URL navigation must use the dedicated navigation debounce.');
assert(searchFilter.includes('}, SEARCH_ANALYTICS_SETTLE_MS);'), 'Search analytics must use the slower settled-query timer.');
assert(searchFilter.includes("trackPostHogEvent('search_query'"), 'Committed settled queries must emit search_query analytics.');
assert(searchFilter.includes("trackGaEvent('search_query'") && searchFilter.includes('search_term: pending.query'), 'Committed settled queries must mirror into GA4 using the standard search_term dimension.');
assert(searchFilter.includes("trackPostHogEvent('search_cleared'"), 'Settled clear actions must still emit search_cleared analytics.');
assert(searchFilter.includes("trackGaEvent('search_cleared'"), 'Settled clear actions must preserve GA4 parity.');
assert(searchFilter.includes('lastTrackedQueryRef.current = currentQuery;'), 'External query synchronization must not be misclassified as fresh user search intent.');
assert(searchFilter.includes('}, [value, pathname, router]);'), 'Typing debounce must not restart when stale server search params arrive.');
assert(searchFilter.includes('setValue(currentQuery)'), 'SearchFilter must still sync genuine external query changes such as clear-all/back navigation.');
assert(!searchFilter.includes('resultRevealRequest'), 'Search submit must not force-scroll away from the map-first discovery surface.');
assert(exploreView.includes('className="relative mb-3 h-[340px] overflow-hidden rounded-[18px] sm:h-[400px] [contain:layout_paint_style]"'), 'Mobile list map must keep its original map-first height.');
assert(searchFilter.includes('const navigationPending = value.trim() !== currentQuery;'), 'Search input must expose pending navigation state while committed results catch up.');
assert(searchFilter.includes('aria-label="Axtarılır"'), 'Search input must provide accessible pending feedback.');
assert(searchFilter.includes('animate-spin'), 'Pending search feedback must remain visually lightweight and recognizable.');
assert(searchFilter.includes("inputRef.current?.focus({ preventScroll: true })"), 'Clearing search must keep typing flow ready without shifting the page.');
assert(exploreView.includes('id="club-results"'), 'Discovery must expose a stable search-result reveal target.');
assert(exploreView.includes('Axtarış nəticələri ('), 'Active search must label the result count explicitly.');
assert(exploreView.includes('“${searchQuery}” üçün uyğun klublar'), 'Active search must echo the committed query in the result context.');
assert(exploreView.includes('const hasStructuredFilters = Boolean(filters.district || filters.type || filters.priceMax);'), 'Search empty state must know whether structured filters are also active.');
assert(exploreView.includes('searchQuery={searchQuery}'), 'Search empty state must receive the committed query for missing-club suggestions.');

assert(clubsQuery.includes('function normalizeSearchText'), 'Club search must normalize Azerbaijani spelling variants before matching.');
for (const token of [".replace(/ə/g, 'e')", ".replace(/ı/g, 'i')", ".replace(/ö/g, 'o')", ".replace(/ü/g, 'u')", ".replace(/ş/g, 's')", ".replace(/ç/g, 'c')", ".replace(/ğ/g, 'g')"]) {
  assert(clubsQuery.includes(token), `Club search normalization must preserve Azerbaijani transliteration rule ${token}.`);
}
assert(clubsQuery.includes("const normalizedSearchTerms = normalizeSearchText(filters.q)"), 'Club search must tokenize the normalized settled query.');
assert(clubsQuery.includes("SEARCH_LOCATION_STOP_WORDS = new Set(['ms', 'metro', 'metrosu'])"), 'Club search must ignore explicit metro shorthand only when another meaningful search term remains.');
assert(clubsQuery.includes(".replace(/\\bm\\s*\\/\\s*s\\b/giu, ' metro ')"), 'm/s shorthand must normalize to the bounded metro stop-word path.');
assert(clubsQuery.includes("club.district?.name"), 'Club search must include district names so location intent can resolve without exact address wording.');
assert(clubsQuery.includes("return searchTerms.every((term) => searchableText.includes(term));"), 'All normalized search terms must match the club search surface.');
assert(!clubsQuery.includes('name.ilike.%'), 'Public search must not fall back to accent-sensitive DB ilike matching.');
assert(clubsQuery.includes("['gameyer-public-clubs-v9']"), 'Public club query cache must remain bumped after tolerant search semantics change.');

console.log('Search input regression checks passed.');
