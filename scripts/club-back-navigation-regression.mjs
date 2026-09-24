import { readFile } from 'node:fs/promises';

const [backSource, cardSource, exploreSource] = await Promise.all([
  readFile(new URL('../src/components/clubs/BackToClubsLink.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/clubs/ClubCard.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/explore/ExploreView.tsx', import.meta.url), 'utf8'),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(backSource.includes('window.history.back()'), 'Club return must reuse the previous cached discovery history entry.');
assert(backSource.includes('data-back-to-clubs="true"'), 'Club return link must expose a stable browser-smoke selector independent of user-facing copy.');
assert(backSource.includes("return 'Axtarış nəticələrinə qayıt'"), 'Club return CTA must identify search-result origins.');
assert(backSource.includes("return 'Xəritəyə qayıt'"), 'Club return CTA must identify map origins.');
assert(backSource.includes("return 'Filtrlənmiş klublara qayıt'"), 'Club return CTA must identify structured-filter origins.');
assert(backSource.includes('const fallbackHref = entry?.origin ?? \'/\';'), 'Club return link fallback must preserve the exact discovery origin.');
assert(backSource.includes('useSyncExternalStore'), 'Club return context must derive from sessionStorage without effect-driven state churn.');
assert(!backSource.includes('window.location.replace(origin)'), 'Club return must not force a full document reload.');
assert(backSource.includes('entry.destination !== pathname'), 'Club return must validate that the remembered origin belongs to the current club detail page.');
assert(backSource.includes("entry.origin.startsWith('/klub/')"), 'Club return must reject club-detail origins.');
assert(backSource.includes("const MOBILE_EXPANDED_STATE_KEY = 'gameyer:mobile-expanded-state'"), 'Club entry tracking must know the mobile expanded-list state key.');
assert(backSource.includes("document.querySelector<HTMLElement>('[data-mobile-scroll-root=\"true\"]')"), 'Club navigation must resolve the mobile app-shell scroll root.');
assert(backSource.includes('scrollY: currentDiscoveryScrollTop()'), 'Club navigation must snapshot the inner discovery scroll position when leaving the list.');

assert(cardSource.includes('prefetch={false}'), 'Club cards must disable viewport-driven route prefetch that can compete with mobile scrolling.');
assert(cardSource.includes('router.prefetch(clubHref)'), 'Fine-pointer desktop navigation should still prefetch on deliberate hover/focus intent.');
assert(cardSource.includes("transport: 'sendBeacon'"), 'Mobile club click analytics must retain unload-safe beacon transport.');
assert(cardSource.includes('send_instantly: true'), 'Mobile club click analytics must still flush immediately.');
assert(!cardSource.includes('window.location.assign(clubHref)'), 'Club cards must not force full document navigation.');
assert(cardSource.includes('touch-pan-y'), 'Club cards must explicitly preserve browser-native vertical touch scrolling.');
assert(cardSource.includes('[content-visibility:auto]'), 'Offscreen club cards must be eligible for rendering skip during long mobile lists.');

assert(exploreSource.includes("const MOBILE_EXPANDED_STATE_KEY = 'gameyer:mobile-expanded-state'"), 'Expanded mobile list state must be persisted in session storage.');
assert(exploreSource.includes('window.location.pathname') && exploreSource.includes('window.location.search') && exploreSource.includes('window.location.hash'), 'Expanded state must be scoped to the exact discovery URL including query/hash state.');
assert(exploreSource.includes('savedState.origin !== getCurrentExploreOrigin()'), 'Expanded state from another discovery URL must not be restored.');
assert(exploreSource.includes("window.matchMedia('(min-width: 1024px)').matches"), 'Expanded-state restoration must remain mobile-only.');
assert(exploreSource.includes('setMobileExpanded(true)'), 'Returning to the matching discovery URL must restore the expanded club list.');
assert(exploreSource.includes("document.querySelector<HTMLElement>('[data-mobile-scroll-root=\"true\"]')"), 'ExploreView must target the mobile app-shell scroll root.');
assert(exploreSource.includes('restoreMobileScrollTop(restoredScrollY)'), 'Returning to the list must restore the saved inner scroll position.');
assert(!exploreSource.includes("window.addEventListener('scroll', persistScroll"), 'Expanded mobile list must not synchronously write session storage during scrolling.');
assert(exploreSource.includes('if (nextExpanded) saveMobileExpandedState(getMobileScrollTop());') && exploreSource.includes('else clearMobileExpandedState();'), 'Expand must persist inner scroll state and collapse must clear it so stale expanded state is not kept after “Daha az klub göstər”.');
assert(exploreSource.includes("mobileExpanded ? 'Daha az klub göstər'"), 'The restored expanded list must remain collapsible after return.');
assert(exploreSource.includes('grid-cols-[390px_minmax(0,1fr)]'), 'Desktop discovery cards must use the same compact mobile-like card width target.');

console.log('Club back-navigation, scroll performance, and card parity regression checks passed.');
