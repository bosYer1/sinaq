import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mobileNav = await readFile(new URL('../src/components/navigation/MobileNav.tsx', import.meta.url), 'utf8');
const searchFilter = await readFile(new URL('../src/components/filters/SearchFilter.tsx', import.meta.url), 'utf8');
const layout = await readFile(new URL('../src/app/layout.tsx', import.meta.url), 'utf8');
const mobileViewportSync = await readFile(new URL('../src/components/navigation/MobileViewportSync.tsx', import.meta.url), 'utf8');
const globals = await readFile(new URL('../src/app/globals.css', import.meta.url), 'utf8');
const menuPage = await readFile(new URL('../src/app/menyu/page.tsx', import.meta.url), 'utf8');

assert.ok(mobileNav.includes('href="/#club-search"'), 'Mobile search navigation must keep the #club-search destination');
assert.ok(mobileNav.includes('data-mobile-nav-static="true"'), 'Mobile navigation must be a normal-flow row in the app shell.');
assert.ok(mobileNav.includes('shrink-0'), 'Mobile navigation must reserve its own row instead of overlaying page content.');
assert.ok(mobileNav.includes('pb-[env(safe-area-inset-bottom)]'), 'Mobile nav must preserve iPhone safe-area padding.');
assert.ok(mobileNav.includes('min-h-[58px]'), 'Mobile nav must keep the compact 58px visual row.');
assert.ok(mobileNav.includes('h-9 w-9'), 'Primary mobile search control must stay visually compact.');
assert.ok(layout.includes('h-14 max-w-[1440px]') && layout.includes('md:h-16'), 'Mobile header must be compact without changing desktop header height.');
assert.ok(!mobileNav.includes('fixed'), 'Mobile navigation must not use position:fixed on iOS.');
assert.ok(!mobileNav.includes('absolute'), 'Mobile navigation must not use position:absolute.');
assert.ok(!mobileNav.includes('window.visualViewport'), 'Mobile navigation itself must not own viewport positioning logic.');
assert.ok(!mobileNav.includes('window.scrollTo'), 'Mobile navigation must never mutate page scroll position.');
assert.ok(!mobileNav.includes('nav.style.'), 'Mobile navigation must not write runtime positioning styles.');

assert.ok(layout.includes('MobileViewportSync'), 'Root layout must install the visual viewport height synchronizer.');
assert.ok(layout.includes('data-mobile-app-shell="true"'), 'Root layout must expose a mobile app shell.');
assert.ok(layout.includes('data-mobile-scroll-root="true"'), 'Root layout must isolate mobile page scrolling inside main.');
assert.ok(layout.includes('h-[var(--gameyer-mobile-vh,100svh)]'), 'Mobile app shell must use measured visual viewport height with a small-viewport fallback.');
assert.ok(layout.includes('overflow-hidden bg-bg'), 'Root body must prevent mobile document scrolling.');
assert.ok(layout.includes('min-h-0 flex-1 overflow-y-auto'), 'Mobile main must own vertical scrolling.');
assert.ok(!layout.includes('pb-[76px] md:pb-0'), 'Root main must not add legacy overlay padding now that nav is in flow.');
assert.ok(layout.includes("viewportFit: 'cover'"), 'Root layout must retain iOS edge-to-edge viewport behavior.');

assert.ok(mobileViewportSync.includes('window.visualViewport'), 'Viewport synchronizer must read the real visual viewport height.');
assert.ok(mobileViewportSync.includes("root.style.setProperty(MOBILE_VIEWPORT_HEIGHT_VAR"), 'Viewport synchronizer must publish measured height to CSS.');
assert.ok(mobileViewportSync.includes("visualViewport?.addEventListener('resize', settleHeight)"), 'Viewport synchronizer must react to keyboard/browser chrome resize.');
assert.ok(mobileViewportSync.includes('}, [pathname]);'), 'Viewport height must resettle after client-side route changes.');
assert.ok(!mobileViewportSync.includes('window.scrollTo'), 'Viewport synchronizer must never move the document.');

assert.ok(globals.includes("body {\n    height: 100%;\n    overflow: hidden;"), 'Mobile root scrolling must be disabled at the document level.');
assert.ok(globals.includes("[data-mobile-scroll-root='true']"), 'Mobile inner scroll root must have explicit iOS scrolling behavior.');
assert.ok(menuPage.includes('min-h-full md:min-h-[calc(100vh-64px)]'), 'Menu page must fill the mobile scroll root without adding a second viewport-height calculation.');
assert.ok(!menuPage.includes('min-h-[calc(100dvh-64px)]'), 'Menu page must not stack its own mobile dvh minimum on top of the app shell.');

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
