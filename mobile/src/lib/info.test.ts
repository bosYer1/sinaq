import { INFO_PAGES, infoPage } from './info';
import { allowedExternalUrl, directionsUrl } from './actions';
const { readFileSync, existsSync } = jest.requireActual('node:fs');

test('More contains informational pages only, rejects arbitrary routes', () => {
  expect(Object.keys(INFO_PAGES)).toEqual(['contact', 'owners', 'about', 'privacy']);
  expect(infoPage('owners')?.url).toBeNull();
  for (const page of ['__proto__', 'constructor', '../admin', undefined]) expect(infoPage(page)).toBeNull();
});
test('appearance lives outside tabs and More links to it', () => {
  expect(existsSync('src/app/appearance.tsx')).toBe(true);
  expect(existsSync('src/app/(tabs)/appearance.tsx')).toBe(false);
  const tabs = readFileSync('src/app/(tabs)/_layout.tsx', 'utf8');
  for (const name of ['index', 'map', 'nearby', 'more']) expect(tabs).toContain(`name="${name}"`);
  expect(readFileSync('src/app/(tabs)/more.tsx', 'utf8')).toContain("router.push('/appearance')");
});
test('external actions allow only the intended public destinations', () => {
  for (const page of Object.values(INFO_PAGES)) if (page.url) expect(allowedExternalUrl(page.url)).toBe(true);
  expect(allowedExternalUrl(directionsUrl(40.4, 49.8)!)).toBe(true);
  expect(allowedExternalUrl('tel:+994501234567')).toBe(true);
  for (const url of ['javascript:alert(1)', 'https://gameyer.az/admin', 'https://gameyer.az.evil.test/mexfilik', 'https://user@gameyer.az/mexfilik', 'https://gameyer.az/mexfilik?next=evil', 'https://www.google.com/maps/dir/?api=1&destination=,']) expect(allowedExternalUrl(url)).toBe(false);
});
