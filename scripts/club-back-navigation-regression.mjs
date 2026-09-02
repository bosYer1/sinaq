import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/clubs/BackToClubsLink.tsx', import.meta.url), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(source.includes('window.location.replace(origin)'), 'Club return must use a clean document navigation to the remembered discovery URL.');
assert(!source.includes('router.back()'), 'Club return must not restore the stale App Router history snapshot.');
assert(source.includes('entry.destination !== window.location.pathname'), 'Club return must validate that the remembered origin belongs to the current club detail page.');
assert(source.includes("entry.origin.startsWith('/klub/')"), 'Club return must reject club-detail origins.');

console.log('Club back-navigation regression checks passed.');
