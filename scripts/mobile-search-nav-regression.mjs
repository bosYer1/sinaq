import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const layout = await readFile(new URL('../src/app/layout.tsx', import.meta.url), 'utf8');
const searchFilter = await readFile(new URL('../src/components/filters/SearchFilter.tsx', import.meta.url), 'utf8');

assert.ok(layout.includes('href="/#club-search"'), 'Mobile search navigation must keep the #club-search destination');
assert.ok(searchFilter.includes('a[href="/#club-search"]'), 'SearchFilter must intercept same-page mobile search navigation');
assert.ok(searchFilter.includes('event.preventDefault()'), 'Same-page mobile search navigation must prevent the no-op hash navigation');
assert.ok(searchFilter.includes("document.addEventListener('click', handleMobileSearchNavigation, true)"), 'Search navigation interception must run in capture phase before Next Link routing');
assert.ok(searchFilter.includes("document.removeEventListener('click', handleMobileSearchNavigation, true)"), 'Search navigation capture listener must be removed cleanly');
assert.ok(searchFilter.includes("window.history.replaceState(window.history.state, '', '#club-search')"), 'Search navigation must keep the canonical #club-search hash');
assert.ok(searchFilter.includes("document.getElementById('club-search')"), 'Search navigation must resolve the search container');
assert.ok(searchFilter.includes("scrollIntoView({ behavior: 'smooth', block: 'start' })"), 'Search navigation must visibly move the search controls into view');
assert.ok(searchFilter.includes('inputRef.current?.focus({ preventScroll: true })'), 'Search navigation must focus the search input for immediate typing');
assert.ok(searchFilter.includes("window.location.hash === '#club-search'"), 'SearchFilter must focus after cross-page navigation arrives on the hash');

console.log('Mobile search navigation regression passed.');
