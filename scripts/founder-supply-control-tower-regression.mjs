import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const template = await readFile(new URL('../src/app/admin/statistika/template.tsx', import.meta.url), 'utf8');

assert.ok(template.includes('data-founder-supply-health="true"'), 'Founder statistics must expose the supply-health control tower.');
assert.ok(template.includes(".from('clubs')"), 'Supply health must derive inventory from the real clubs table.');
assert.ok(template.includes(".from('club_submissions')"), 'Supply health must include the real submissions queue.');
assert.ok(template.includes("['pc', 'playstation']"), 'Public-ready supply must require a supported PC or PlayStation type.');
assert.ok(template.includes('club.is_active && hasCoordinates && hasInstagram && hasType'), 'Public-ready logic must stay aligned with public club visibility requirements.');
assert.ok(template.includes("row.status === 'resolved' && row.club_id"), 'Claimed clubs must be derived only from resolved linked owner claims.');
assert.ok(template.includes('Yanlış 0 göstərmək əvəzinə'), 'Read failures must not silently present false zero metrics.');
assert.ok(template.includes('Heç bir boş sahə standart məlumatla doldurulmur.'), 'Supply reporting must preserve the no-fake-data operating rule.');

console.log('founder supply control tower regression: ok');
