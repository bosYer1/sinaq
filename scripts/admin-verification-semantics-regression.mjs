import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [analytics, clubDetail, adminHome] = await Promise.all([
  readFile(new URL('../src/app/admin/analitika/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/admin/klublar/[id]/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/admin/page.tsx', import.meta.url), 'utf8'),
]);

assert.ok(
  analytics.includes('Founder təsdiqli klub') &&
  analytics.includes('Founder təsdiqli bazadadır') &&
  analytics.includes('ayrıca doğrulanmış işarəsi daşıyır; bunu klub sahibinin təsdiqi kimi oxuma'),
  'Founder Analytics must separate active Founder-approved inventory from owner verification.',
);

assert.ok(
  clubDetail.includes('Verification flag aktivdir') &&
  clubDetail.includes('Verification flag yoxdur') &&
  clubDetail.includes('Verification flag-ı ləğv et'),
  'Club admin detail must present is_verified as a neutral flag, not ownership proof.',
);

assert.ok(
  adminHome.includes('Verification flag') &&
  adminHome.includes('Founder-approved aktiv inventardan ayrı raw flag · owner təsdiqi kimi oxuma'),
  'Admin home must keep raw verification separate from Founder approval and owner proof.',
);

assert.ok(
  !clubDetail.includes('>✓ Təsdiqlənib<') &&
  !adminHome.includes('>Təsdiqlənmiş<') &&
  !analytics.includes('klub verified statusundadır'),
  'Ambiguous generic verified wording must not return in admin inventory surfaces.',
);

console.log('admin verification semantics regression: PASS');
