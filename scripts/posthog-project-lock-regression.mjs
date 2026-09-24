import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const nextConfig = await readFile(new URL('../next.config.js', import.meta.url), 'utf8');
const posthog = await readFile(new URL('../src/lib/founder-analytics/posthog-server.ts', import.meta.url), 'utf8');

assert.match(
  nextConfig,
  /POSTHOG_PROJECT_ID:\s*'585472'/,
  'Founder Analytics must pin the GameYer PostHog project at build time.',
);
assert.match(
  nextConfig,
  /POSTHOG_API_HOST:\s*'https:\/\/us\.posthog\.com'/,
  'Founder Analytics must pin the reviewed GameYer PostHog API host.',
);
assert.match(
  posthog,
  /GAMEYER_POSTHOG_PROJECT_ID = '585472'/,
  'The server adapter fallback must stay aligned with the GameYer PostHog project.',
);
assert.match(
  posthog,
  /GAMEYER_POSTHOG_HOST = 'https:\/\/us\.posthog\.com'/,
  'The server adapter fallback host must stay aligned with the build-time lock.',
);

console.log('PostHog project lock regression PASS');
