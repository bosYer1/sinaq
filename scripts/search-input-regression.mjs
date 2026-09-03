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
assert(searchFilter.includes('currentQueryRef'), 'SearchFilter must track the latest committed query without restarting the typing debounce.');
assert(searchFilter.includes('paramsStringRef'), 'SearchFilter must preserve the latest URL parameters without making them debounce dependencies.');
assert(searchFilter.includes('const currentQueryAtDispatch = currentQueryRef.current;'), 'Search dispatch must compare against the latest committed query at timer execution time.');
assert(searchFilter.includes('nextQuery === lastRequestedQueryRef.current'), 'Search dispatch must deduplicate an already requested final query.');
assert(searchFilter.includes('}, [value, pathname, router]);'), 'Typing debounce must not restart when stale server search params arrive.');
assert(searchFilter.includes('setValue(currentQuery)'), 'SearchFilter must still sync genuine external query changes such as clear-all/back navigation.');

console.log('Search input regression checks passed.');
