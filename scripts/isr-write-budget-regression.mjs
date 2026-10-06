import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sixHourRoutes = [
  '../src/app/klub/[slug]/page.tsx',
  '../src/app/rayon/[slug]/page.tsx',
  '../src/app/rayon/[slug]/[type]/page.tsx',
];

for (const relative of sixHourRoutes) {
  const source = await readFile(new URL(relative, import.meta.url), 'utf8');
  assert.match(
    source,
    /export const revalidate = 21600;/,
    `${relative} must keep the six-hour ISR safety interval`,
  );
  assert.doesNotMatch(
    source,
    /export const revalidate = 60;/,
    `${relative} must not regress to one-minute ISR churn`,
  );
}

const updatesPage = await readFile(
  new URL('../src/app/yenilikler/page.tsx', import.meta.url),
  'utf8',
);
assert.match(
  updatesPage,
  /export const revalidate = 1800;/,
  'Updates page must stay fresh within 30 minutes without one-minute ISR churn',
);
assert.doesNotMatch(
  updatesPage,
  /export const revalidate = 60;/,
  'Updates page must not regress to one-minute ISR churn',
);

const popularity = await readFile(
  new URL('../src/lib/queries/club-popularity.ts', import.meta.url),
  'utf8',
);
assert.match(
  popularity,
  /revalidate: 21600/,
  '30-day popularity data must not force public discovery routes to refresh every ten minutes',
);
assert.doesNotMatch(
  popularity,
  /revalidate: 600/,
  'Popularity cache must not regress to the previous ten-minute ISR pressure',
);

console.log('ISR write budget regression: PASS');
