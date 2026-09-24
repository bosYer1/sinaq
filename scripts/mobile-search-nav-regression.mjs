import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mobileNav = await readFile(new URL('../src/components/navigation/MobileNav.tsx', import.meta.url), 'utf8');
const searchFilter = await readFile(new URL('../src/components/filters/SearchFilter.tsx', import.meta.url), 'utf8');

assert.ok(mobileNav.includes('href="/#club-search"'), 'Mobile search navigation must keep the #club-search destination');
assert.ok(mobileNav.includes('fixed inset-x-0 bottom-0'), 'Mobile navigation must keep a CSS fixed-bottom fallback.');
assert.ok(!mobileNav.includes('[transform:translateZ(0)]'), 'Mobile navigation must not keep a transformed compositor layer that can retain stale keyboard geometry on iOS.');
assert.ok(mobileNav.includes('window.visualViewport'), 'Mobile navigation must observe the real visual viewport on mobile browsers.');
assert.ok(mobileNav.includes('getMobileNavBottomOffset'), 'Mobile navigation must use the signed visual/layout viewport delta helper.');
assert.ok(mobileNav.includes('nav.style.bottom = \`${bottomOffset}px\`'), 'Mobile navigation must apply the signed viewport delta, including negative recovery offsets.');
assert.ok(!mobileNav.includes('Math.max(0'), 'Mobile navigation must not clamp negative recovery offsets after keyboard dismissal.');
assert.ok(mobileNav.includes("document.addEventListener('focusout', settleAfterKeyboard, true)"), 'Mobile navigation must re-settle after the keyboard/input focus closes.');
assert.ok(mobileNav.includes('for (const delay of [50, 150, 300])'), 'Mobile navigation must tolerate delayed iOS viewport restoration after keyboard dismissal.');
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
