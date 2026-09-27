import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(new URL('../supabase/migrations/20260927140500_filter_admin_analytics_synthetic_traffic.sql', import.meta.url), 'utf8');

assert.equal((migration.match(/create or replace function public\.get_admin_analytics\(\)/g) || []).length, 1, 'Legacy admin RPC must be replaced exactly once.');
assert.equal((migration.match(/create or replace function public\.get_admin_analytics_24h\(\)/g) || []).length, 1, 'Rolling 24h RPC must be replaced exactly once.');
assert.equal((migration.match(/from public\.page_views/g) || []).length, 2, 'Only the two clean-page-view CTEs may read raw page_views.');
assert.equal((migration.match(/with clean_page_views as/g) || []).length, 2, 'Both admin RPCs must define one clean page-view source.');
assert.ok(migration.includes("coalesce(user_agent, '') !~* '(bot|crawler|spider|headless|playwright|puppeteer|lighthouse)'"), 'Synthetic-UA contract must match application analytics.');
assert.ok(!migration.includes('left join public.page_views'), 'Hourly aggregation must not reintroduce raw page_views.');
assert.ok((migration.match(/from clean_page_views/g) || []).length >= 20, 'Legacy aggregate reads must consume the clean source.');
assert.ok(migration.includes("count(distinct coalesce(visit_id, 'legacy:' || session_id))"), '24h visit/session semantics must stay unchanged.');
assert.ok(migration.includes("time zone 'Asia/Baku'"), 'Baku day/hour boundary semantics must stay unchanged.');
assert.equal((migration.match(/public\.is_admin\(\)/g) || []).length, 2, 'Both RPCs must preserve admin authorization gating.');
assert.ok(migration.includes('security invoker'), 'RPC caller security semantics must remain SECURITY INVOKER.');
assert.ok(migration.includes('from public.analytics_events'), 'CTA aggregates must remain on analytics_events rather than being silently dropped.');

console.log('Admin analytics clean-traffic regression passed.');
