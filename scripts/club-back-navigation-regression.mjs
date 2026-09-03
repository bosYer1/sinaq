import { readFile } from 'node:fs/promises';

const backSource = await readFile(new URL('../src/components/clubs/BackToClubsLink.tsx', import.meta.url), 'utf8');
const cardSource = await readFile(new URL('../src/components/clubs/ClubCard.tsx', import.meta.url), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(backSource.includes('window.location.replace(origin)'), 'Club return must use a clean document navigation to the remembered discovery URL.');
assert(!backSource.includes('router.back()'), 'Club return must not restore the stale App Router history snapshot.');
assert(backSource.includes('entry.destination !== window.location.pathname'), 'Club return must validate that the remembered origin belongs to the current club detail page.');
assert(backSource.includes("entry.origin.startsWith('/klub/')"), 'Club return must reject club-detail origins.');

assert(cardSource.includes("window.matchMedia('(max-width: 1023px)').matches"), 'Mobile club navigation must bypass the App Router history snapshot.');
assert(cardSource.includes('event.preventDefault()'), 'Mobile club navigation must prevent the client-side Link transition.');
assert(cardSource.includes('window.location.assign(clubHref)'), 'Mobile club navigation must use a full document navigation so browser Back returns cleanly.');

console.log('Club back-navigation regression checks passed.');
