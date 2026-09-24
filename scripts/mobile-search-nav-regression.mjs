import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mobileNav = await readFile(new URL('../src/components/navigation/MobileNav.tsx', import.meta.url), 'utf8');
const searchFilter = await readFile(new URL('../src/components/filters/SearchFilter.tsx', import.meta.url), 'utf8');

assert.ok(mobileNav.includes('href="/#club-search"'), 'Mobile search navigation must keep the #club-search destination');
assert.ok(mobileNav.includes('fixed inset-x-0 bottom-0'), 'Mobile navigation must keep a CSS fixed-bottom fallback.');
assert.ok(!mobileNav.includes('[transform:translateZ(0)]'), 'Mobile navigation must not keep a transformed compositor layer that can retain stale keyboard geometry on iOS.');
assert.ok(mobileNav.includes('window.visualViewport'), 'Mobile navigation must observe the real visual viewport on mobile browsers.');
assert.ok(mobileNav.includes('getMobileNavVisualTop'), 'Mobile navigation must derive its explicit top coordinate from the visual viewport.');
assert.ok(mobileNav.includes('nav.style.top = \`${visualTop}px\`'), 'Mobile navigation must write the visual-viewport-derived top coordinate directly.');
assert.ok(mobileNav.includes("nav.style.bottom = 'auto'"), 'Visual viewport mode must stop relying on fixed bottom anchoring.');
assert.ok(!mobileNav.includes('window.innerHeight'), 'Mobile navigation must not use stale layout viewport height for iOS positioning.');
assert.ok(!mobileNav.includes('getMobileNavBottomOffset'), 'The failed signed bottom-offset workaround must stay removed.');
assert.ok(mobileNav.includes("document.addEventListener('focusout', settleViewport, true)"), 'Mobile navigation must re-settle after the keyboard/input focus closes.');
assert.ok(mobileNav.includes('for (const delay of [50, 150, 300])'), 'Mobile navigation must tolerate delayed WebKit visual viewport updates.');
assert.ok(mobileNav.includes("window.addEventListener('pageshow', settleViewport)"), 'Mobile navigation must re-anchor after iOS page-cache restores.');
assert.ok(mobileNav.includes("document.addEventListener('visibilitychange', handleVisibilityChange)"), 'Mobile navigation must re-anchor when the browser tab becomes visible again.');
assert.ok(mobileNav.includes('}, [pathname]);'), 'Mobile navigation must re-anchor after every client-side route transition.');
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
