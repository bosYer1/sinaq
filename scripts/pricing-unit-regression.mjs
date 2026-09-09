import fs from 'node:fs';

const migration = fs.readFileSync('supabase/migrations/20260909192500_normalize_pricing_units.sql', 'utf8');
const editor = fs.readFileSync('src/components/admin/ClubPricingEditor.tsx', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = fs.readFileSync('supabase/production-migrations.txt', 'utf8');

const checks = [
  [migration.includes("c.slug = 'ibrazoro-cyber-zone-28-may'"), 'migration is scoped to the known Cyber Zone branch'],
  [migration.includes("c.slug = 'ibrazoro-playstation'"), 'migration is scoped to the known PlayStation branch'],
  [migration.includes("when 'Saatlıq' then 'saat'"), 'hourly rows normalize to saat'],
  [migration.includes("when '3 saat paket' then '3 saat paket'"), '3-hour packages keep package semantics'],
  [migration.includes("when '5 saat paket' then '5 saat paket'"), '5-hour packages keep package semantics'],
  [migration.includes("when '10 saat paket (00:00–10:00)' then '10 saat paket'"), '10-hour package unit is canonicalized without changing the schedule label'],
  [migration.includes("check (unit !~* 'azn' and position('₼' in unit) = 0)"), 'database rejects currency tokens in pricing units'],
  [migration.includes("raise exception 'Qiymət vahidinə AZN və ya ₼ yazmaq olmaz"), 'admin atomic persistence rejects malformed units with a clear error'],
  [migration.indexOf("raise exception 'Qiymət vahidinə AZN və ya ₼ yazmaq olmaz") < migration.indexOf('delete from public.club_type_assignments'), 'admin validation runs before relation replacement starts'],
  [editor.includes('AZN və ₼ vahid sahəsinə yazılmır'), 'admin UI explains that currency is not part of the unit'],
  [manifest.includes('20260909192500_normalize_pricing_units'), 'migration is listed in the production manifest'],
  [pkg.scripts?.test?.includes('node scripts/pricing-unit-regression.mjs'), 'pricing unit regression runs in the standard test suite'],
];

for (const [passed, message] of checks) {
  if (!passed) throw new Error(`pricing unit regression failed: ${message}`);
}

console.log(`pricing unit regression passed (${checks.length} checks)`);
