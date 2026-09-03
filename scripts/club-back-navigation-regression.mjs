import { readFile } from 'node:fs/promises';

const [backSource, cardSource, exploreSource] = await Promise.all([
  readFile(new URL('../src/components/clubs/BackToClubsLink.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/clubs/ClubCard.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/explore/ExploreView.tsx', import.meta.url), 'utf8'),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(backSource.includes('window.location.replace(origin)'), 'Club return must use a clean document navigation to the remembered discovery URL.');
assert(!backSource.includes('router.back()'), 'Club return must not restore the stale App Router history snapshot.');
assert(backSource.includes('entry.destination !== window.location.pathname'), 'Club return must validate that the remembered origin belongs to the current club detail page.');
assert(backSource.includes("entry.origin.startsWith('/klub/')"), 'Club return must reject club-detail origins.');

assert(cardSource.includes("window.matchMedia('(max-width: 1023px)').matches"), 'Mobile club navigation must bypass the App Router history snapshot.');
assert(cardSource.includes("transport: 'sendBeacon'"), 'Mobile hard navigation must send club_card_click with beacon transport before unload.');
assert(cardSource.includes('send_instantly: true'), 'Mobile hard navigation must flush club_card_click immediately before unload.');
assert(cardSource.includes('event.preventDefault()'), 'Mobile club navigation must prevent the client-side Link transition.');
assert(cardSource.includes('window.location.assign(clubHref)'), 'Mobile club navigation must use a full document navigation so browser Back returns cleanly.');

assert(exploreSource.includes("const MOBILE_EXPANDED_STATE_KEY = 'gameyer:mobile-expanded-state'"), 'Expanded mobile list state must be persisted in session storage.');
assert(exploreSource.includes('window.location.pathname') && exploreSource.includes('window.location.search') && exploreSource.includes('window.location.hash'), 'Expanded state must be scoped to the exact discovery URL including query/hash state.');
assert(exploreSource.includes('savedState.origin !== getCurrentExploreOrigin()'), 'Expanded state from another discovery URL must not be restored.');
assert(exploreSource.includes("window.matchMedia('(min-width: 1024px)').matches"), 'Expanded-state restoration must remain mobile-only.');
assert(exploreSource.includes('setMobileExpanded(true)'), 'Returning to the matching discovery URL must restore the expanded club list.');
assert(exploreSource.includes("window.scrollTo({ top: restoredScrollY, left: 0, behavior: 'auto' })"), 'Returning to the list must restore the saved scroll position.');
assert(exploreSource.includes("window.addEventListener('scroll', persistScroll, { passive: true })"), 'Expanded mobile list must keep its saved scroll position current.');
assert(exploreSource.includes('if (nextExpanded) saveMobileExpandedState(window.scrollY);') && exploreSource.includes('else clearMobileExpandedState();'), 'Expand must persist state and collapse must clear it so stale expanded state is not kept after “Daha az klub göstər”.');
assert(exploreSource.includes("mobileExpanded ? 'Daha az klub göstər'"), 'The restored expanded list must remain collapsible after return.');

console.log('Club back-navigation and expanded-list restoration regression checks passed.');
