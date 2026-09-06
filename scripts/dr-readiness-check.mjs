import assert from 'node:assert/strict';

const rawBaseUrl = process.env.DR_BASE_URL;
assert.ok(rawBaseUrl, 'DR_BASE_URL is required (for example https://standby.example.com).');

const baseUrl = new URL(rawBaseUrl);
assert.ok(
  baseUrl.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(baseUrl.hostname),
  'DR_BASE_URL must use HTTPS unless it points to localhost.',
);

const expectStandby = process.env.DR_EXPECT_STANDBY === '1';
const expectedAnalyticsWrite = process.env.DR_EXPECT_ANALYTICS_WRITE?.trim();
const results = [];

async function fetchChecked(pathname, { contentType, status = 200, redirect = 'follow' } = {}) {
  const response = await fetch(new URL(pathname, baseUrl), {
    redirect,
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(response.status, status, `${pathname} returned HTTP ${response.status}`);
  if (contentType) {
    assert.match(
      response.headers.get('content-type') ?? '',
      contentType,
      `${pathname} returned an unexpected content type`,
    );
  }
  if (expectStandby && contentType?.test('text/html')) {
    assert.match(
      response.headers.get('x-robots-tag') ?? '',
      /noindex/i,
      `${pathname} is missing the standby noindex header`,
    );
  }
  results.push({ path: pathname, status: response.status });
  return response;
}

const healthResponse = await fetchChecked('/api/health', { contentType: /application\/json/i });
const health = await healthResponse.json();
assert.deepEqual(
  { ok: health.ok, database: health.database, public_data: health.public_data },
  { ok: true, database: 'ok', public_data: 'ok' },
  'Health endpoint did not confirm a readable public club.',
);
if (expectedAnalyticsWrite) {
  assert.equal(
    health.analytics_write,
    expectedAnalyticsWrite,
    `Unexpected analytics write mode: ${health.analytics_write ?? 'missing'}`,
  );
}

const homeResponse = await fetchChecked('/', { contentType: /text\/html/i });
assert.match(await homeResponse.text(), /GameYer/i, 'Home page does not contain the GameYer identity.');

const assetResponse = await fetchChecked('/gameyer-logo.jpeg', { contentType: /image\//i });
assert.ok((await assetResponse.arrayBuffer()).byteLength > 0, 'Brand asset is empty.');

const sitemapResponse = await fetchChecked('/sitemap.xml', { contentType: /(?:application|text)\/xml/i });
const sitemap = await sitemapResponse.text();
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.ok(sitemapUrls.length > 0, 'Sitemap contains no canonical URLs.');
assert.ok(
  sitemapUrls.every((url) => new URL(url).origin === 'https://gameyer.az'),
  'Sitemap contains a non-canonical origin.',
);
const clubPath = [...sitemap.matchAll(/<loc>([^<]+\/klub\/[^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname)
  .find(Boolean);
assert.ok(clubPath, 'Sitemap contains no public club detail URL.');

const clubResponse = await fetchChecked(clubPath, { contentType: /text\/html/i });
assert.match(await clubResponse.text(), /GameYer/i, 'Club detail did not render the application shell.');

const robotsResponse = await fetchChecked('/robots.txt', { contentType: /text\/plain/i });
const robots = await robotsResponse.text();
assert.match(robots, /User-Agent:\s*\*/i, 'robots.txt has no default crawler policy.');
assert.match(robots, /Allow:\s*\//i, 'robots.txt must allow crawlers to observe standby noindex responses.');

for (const adminPath of ['/admin', '/admin/mfa']) {
  const response = await fetchChecked(adminPath, { status: 307, redirect: 'manual' });
  assert.match(
    response.headers.get('location') ?? '',
    /^\/admin\/login(?:\?|$)/,
    `${adminPath} did not fail closed to the admin login boundary.`,
  );
}

console.log(JSON.stringify({ ok: true, base_url: baseUrl.origin, checks: results }, null, 2));
