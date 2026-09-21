import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [analytics, clubDetail, adminHome] = await Promise.all([
  readFile(new URL('../src/app/admin/analitika/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/admin/klublar/[id]/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/admin/page.tsx', import.meta.url), 'utf8'),
]);

assert.ok(
  analytics.includes('Founder-approved klub') &&
  analytics.includes('Founder-approved inventory-dədir') &&
  analytics.includes('owner/rəsmi nümayəndə verifikasiya flag-ı'),
  'Founder Analytics must separate active Founder-approved inventory from owner verification.',
);

assert.ok(
  clubDetail.includes('Owner/rəsmi nümayəndə təsdiqli') &&
  clubDetail.includes('Owner verifikasiyası yoxdur') &&
  clubDetail.includes('Owner verifikasiyasını ləğv et'),
  'Club admin detail must label is_verified strictly as owner/official-representative verification.',
);

assert.ok(
  adminHome.includes('Owner/rəsmi nümayəndə verified') &&
  adminHome.includes('Founder-approved aktiv inventardan ayrı flag'),
  'Admin home must not present raw is_verified as generic Founder approval.',
);

assert.ok(
  !clubDetail.includes('>✓ Təsdiqlənib<') &&
  !adminHome.includes('>Təsdiqlənmiş<') &&
  !analytics.includes('klub verified statusundadır'),
  'Ambiguous generic verified wording must not return in admin inventory surfaces.',
);

console.log('admin verification semantics regression: PASS');
