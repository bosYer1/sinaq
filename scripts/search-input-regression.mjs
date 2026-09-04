import { readFile } from 'node:fs/promises';

const [filterBar, searchFilter] = await Promise.all([
  readFile(new URL('../src/components/filters/FilterBar.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/filters/SearchFilter.tsx', import.meta.url), 'utf8'),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!filterBar.includes('<SearchFilter key={searchQuery} />'), 'SearchFilter must not remount whenever the q parameter changes.');
assert(filterBar.includes('<SearchFilter />'), 'FilterBar must render a stable SearchFilter instance.');
assert(searchFilter.includes('lastRequestedQueryRef'), 'SearchFilter must preserve local typing while URL navigation catches up.');
assert(searchFilter.includes('lastTrackedQueryRef'), 'Search analytics must deduplicate settled queries independently from URL navigation.');
assert(searchFilter.includes('currentQueryRef'), 'SearchFilter must track the latest committed query without restarting the typing debounce.');
assert(searchFilter.includes('paramsStringRef'), 'SearchFilter must preserve the latest URL parameters without making them debounce dependencies.');
assert(searchFilter.includes('const currentQueryAtDispatch = currentQueryRef.current;'), 'Search dispatch must compare against the latest committed query at timer execution time.');
assert(searchFilter.includes('nextQuery === lastRequestedQueryRef.current'), 'Search dispatch must deduplicate an already requested final query.');
assert(searchFilter.includes('const SEARCH_NAVIGATION_DEBOUNCE_MS = 300;'), 'Search result navigation must keep the responsive 300ms debounce.');
assert(searchFilter.includes('const SEARCH_ANALYTICS_SETTLE_MS = 1200;'), 'Search intent analytics must wait for a settled query instead of mirroring navigation debounce.');
assert(searchFilter.includes('}, SEARCH_NAVIGATION_DEBOUNCE_MS);'), 'URL navigation must use the dedicated navigation debounce.');
assert(searchFilter.includes('}, SEARCH_ANALYTICS_SETTLE_MS);'), 'Search analytics must use the slower settled-query timer.');
assert(searchFilter.includes("trackPostHogEvent(nextQuery ? 'search_query' : 'search_cleared'"), 'Settled search intent must still emit search_query/search_cleared analytics.');
assert(searchFilter.includes('lastTrackedQueryRef.current = currentQuery;'), 'External query synchronization must not be misclassified as fresh user search intent.');
assert(searchFilter.includes('}, [value, pathname, router]);'), 'Typing debounce must not restart when stale server search params arrive.');
assert(searchFilter.includes('setValue(currentQuery)'), 'SearchFilter must still sync genuine external query changes such as clear-all/back navigation.');

console.log('Search input regression checks passed.');
