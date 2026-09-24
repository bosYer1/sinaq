import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mobileNav = await readFile(new URL('../src/components/navigation/MobileNav.tsx', import.meta.url), 'utf8');
const searchFilter = await readFile(new URL('../src/components/filters/SearchFilter.tsx', import.meta.url), 'utf8');
const layout = await readFile(new URL('../src/app/layout.tsx', import.meta.url), 'utf8');

assert.ok(mobileNav.includes('href="/#club-search"'), 'Mobile search navigation must keep the #club-search destination');
assert.ok(mobileNav.includes('data-mobile-nav-overlay="true"'), 'Mobile navigation must render inside an isolated viewport overlay.');
assert.ok(mobileNav.includes('fixed inset-x-0 top-0'), 'Mobile nav overlay must anchor from the viewport top instead of fixed bottom.');
assert.ok(mobileNav.includes('h-[100dvh]'), 'Mobile nav overlay must size itself from the dynamic viewport height.');
assert.ok(mobileNav.includes('pointer-events-none'), 'Viewport overlay must not block page interaction outside the nav.');
assert.ok(mobileNav.includes('pointer-events-auto absolute inset-x-0 bottom-0'), 'Mobile nav must pin to the bottom inside the isolated overlay.');
assert.ok(mobileNav.includes('pb-[env(safe-area-inset-bottom)]'), 'Mobile nav must preserve iPhone safe-area padding.');
assert.ok(!mobileNav.includes('window.visualViewport'), 'Mobile navigation must not run visualViewport positioning code.');
assert.ok(!mobileNav.includes('window.scrollTo'), 'Mobile navigation must never mutate page scroll position.');
assert.ok(!mobileNav.includes('nav.style.'), 'Mobile navigation must not write runtime positioning styles.');
assert.ok(!mobileNav.includes('useEffect'), 'Mobile navigation geometry must not depend on scroll/resize effects.');
assert.ok(!mobileNav.includes('useRef'), 'Mobile navigation geometry must not depend on imperative DOM positioning.');
assert.ok(!mobileNav.includes('mobileViewport'), 'The failed viewport helper strategy must stay removed from MobileNav.');
assert.ok(layout.includes("viewportFit: 'cover'"), 'Root layout must retain iOS edge-to-edge viewport behavior.');
assert.ok(!layout.includes('data-mobile-content-end="true"'), 'The obsolete phantom-scroll sentinel must stay removed.');

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
