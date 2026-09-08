import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ga4 = await readFile(new URL('../src/lib/founder-analytics/ga4-server.ts', import.meta.url), 'utf8');
const dashboard = await readFile(new URL('../src/lib/founder-analytics/dashboard.ts', import.meta.url), 'utf8');
const types = await readFile(new URL('../src/lib/founder-analytics/types.ts', import.meta.url), 'utf8');

assert.match(ga4, /import 'server-only'/, 'GA4 adapter must remain server-only');
assert.match(ga4, /analytics\.readonly/, 'GA4 adapter must request read-only Analytics scope');
assert.match(ga4, /GA4_PROPERTY_ID/, 'GA4 property must come from private server env');
assert.match(ga4, /GOOGLE_ANALYTICS_CLIENT_EMAIL/, 'GA4 service account email must come from private server env');
assert.match(ga4, /GOOGLE_ANALYTICS_PRIVATE_KEY/, 'GA4 private key must come from private server env');
assert.doesNotMatch(ga4, /NEXT_PUBLIC_[A-Z0-9_]*(PRIVATE|SECRET|API_KEY)/, 'GA4 credentials must never be public env vars');
assert.match(ga4, /properties\/\$\{propertyId\}:runReport/, 'GA4 adapter must query the Data API');
assert.match(ga4, /function normalizePrivateKey/, 'private-key normalization must remain explicit');
assert.match(ga4, /replace\(\/\\\\n\/g/, 'escaped private-key newlines must be normalized');
assert.match(dashboard, /getGa4Metrics\(range\)/, 'Founder dashboard must execute the GA4 adapter');
assert.match(dashboard, /ga4\.status/, 'Founder provider status must use the live GA4 adapter result');
assert.match(types, /ga4: Ga4Metrics/, 'Founder dashboard contract must expose GA4 metrics');

console.log('GA4 founder analytics regression: PASS');
