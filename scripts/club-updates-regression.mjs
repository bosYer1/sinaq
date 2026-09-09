import fs from 'node:fs';

const migration = fs.readFileSync('supabase/migrations/20260909122500_add_club_updates.sql', 'utf8');
const query = fs.readFileSync('src/lib/queries/club-updates.ts', 'utf8');
const feed = fs.readFileSync('src/components/growth/ClubUpdatesFeed.tsx', 'utf8');
const page = fs.readFileSync('src/app/yenilikler/page.tsx', 'utf8');

const checks = [
  [migration.includes("kind in ('tournament', 'offer')"), 'club updates are limited to tournament and offer kinds'],
  [migration.includes("source_url ~ '^https://'"), 'club updates require an HTTPS evidence source'],
  [migration.includes('ends_at > now()'), 'public policy hides expired updates'],
  [migration.includes('with check (is_admin())'), 'writes stay admin-gated'],
  [migration.includes('execute function public.set_updated_at()'), 'updates keep updated_at current'],
  [query.includes(".eq('is_active', true)"), 'public query requests only active updates'],
  [query.includes(".gt('ends_at', nowIso)"), 'public query excludes expired updates'],
  [feed.includes("trackPostHogEvent('club_update_impression'"), 'update impressions are measured'],
  [feed.includes("trackPostHogEvent('club_update_club_click'"), 'update-to-club transitions are measured'],
  [feed.includes("trackPostHogEvent('club_update_source_click'"), 'official-source clicks are measured'],
  [page.includes('GameYer məlumat uydurmur'), 'empty state explicitly preserves no-fake-data behavior'],
];

for (const [passed, message] of checks) {
  if (!passed) throw new Error(`club updates regression failed: ${message}`);
}

console.log(`club updates regression passed (${checks.length} checks)`);
