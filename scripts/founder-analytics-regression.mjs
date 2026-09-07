import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../src/app/admin/analitika/page.tsx', import.meta.url), 'utf8');
const posthog = await readFile(new URL('../src/lib/founder-analytics/posthog-server.ts', import.meta.url), 'utf8');
const dashboard = await readFile(new URL('../src/lib/founder-analytics/dashboard.ts', import.meta.url), 'utf8');

assert.match(page, /await requireAdmin\(\)/, 'Founder analytics must enforce admin and MFA authorization in the page.');
assert.match(posthog, /^import 'server-only';/m, 'PostHog private API adapter must remain server-only.');
assert.doesNotMatch(page, /POSTHOG_PERSONAL_API_KEY|META_ACCESS_TOKEN|PRIVATE_KEY/, 'Client-rendered dashboard must not reference provider secrets.');
assert.match(dashboard, /configuredProviderStatus\('meta'\)/, 'Meta provider must expose an explicit unavailable state.');
assert.match(dashboard, /configuredProviderStatus\('ga4'\)/, 'GA4 provider must expose an explicit unavailable state.');
assert.match(dashboard, /configuredProviderStatus\('gsc'\)/, 'GSC provider must expose an explicit unavailable state.');
assert.match(posthog, /gameyer_traffic_scope = 'public'/, 'Behavior queries must exclude test traffic.');
assert.match(posthog, /revalidate: 300/, 'PostHog provider must use bounded caching.');

console.log('founder analytics security and provider regression: PASS');
