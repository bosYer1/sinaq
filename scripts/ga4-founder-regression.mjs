import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ga4 = await readFile(new URL('../src/lib/founder-analytics/ga4-server.ts', import.meta.url), 'utf8');
const dashboard = await readFile(new URL('../src/lib/founder-analytics/dashboard.ts', import.meta.url), 'utf8');
const types = await readFile(new URL('../src/lib/founder-analytics/types.ts', import.meta.url), 'utf8');

assert.ok(ga4.includes("import 'server-only'"), 'GA4 adapter must remain server-only');
assert.ok(ga4.includes('analytics.readonly'), 'GA4 adapter must request read-only Analytics scope');
assert.ok(ga4.includes('GA4_PROPERTY_ID') && ga4.includes('GOOGLE_ANALYTICS_CLIENT_EMAIL') && ga4.includes('GOOGLE_ANALYTICS_PRIVATE_KEY'), 'GA4 credentials must come from private server env');
assert.ok(!ga4.includes('NEXT_PUBLIC_GOOGLE_ANALYTICS_PRIVATE_KEY'), 'GA4 private key must never be public');
assert.ok(ga4.includes('analyticsdata.googleapis.com') && ga4.includes('runReport'), 'GA4 adapter must query the official Data API');
assert.ok(ga4.includes('REQUEST_ATTEMPTS = 2') && ga4.includes('response.status === 429 || response.status >= 500'), 'GA4 adapter must retry transient timeout/rate/server failures');
assert.ok(ga4.includes("error.name === 'AbortError'") && ga4.includes('timeout ('), 'GA4 timeout failures must be normalized instead of exposing generic AbortError');
assert.ok(ga4.includes("['founder-analytics-ga4-v2']"), 'GA4 cache version must be bumped after retry hardening');
assert.ok(ga4.search(/try \{\r?\n    return await cachedGa4Metrics/) > ga4.indexOf('const cachedGa4Metrics'), 'GA4 transient provider errors must be handled outside the cached loader');
assert.ok(dashboard.includes('getGa4Metrics(range)') && dashboard.includes('ga4.status'), 'Founder dashboard must execute and surface GA4');
assert.ok(types.includes('ga4: Ga4Metrics'), 'Founder dashboard contract must expose GA4 metrics');

console.log('GA4 founder analytics regression: PASS');
