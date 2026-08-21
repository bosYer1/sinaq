import process from 'node:process';

const CANONICAL_ORIGIN = (process.env.CUTOVER_CANONICAL_ORIGIN || 'https://gameyer.az').replace(/\/$/, '');
const WWW_ORIGIN = (process.env.CUTOVER_WWW_ORIGIN || 'https://www.gameyer.az').replace(/\/$/, '');
const LEGACY_ORIGINS = (process.env.CUTOVER_LEGACY_ORIGINS
  ? process.env.CUTOVER_LEGACY_ORIGINS.split(',')
  : [
      process.env.CUTOVER_LEGACY_ORIGIN || 'https://gameyerr-gameyer.vercel.app',
      'https://bosyer-web.vercel.app',
    ])
  .map((value) => value.trim().replace(/\/$/, ''))
  .filter(Boolean);

function assert(condition, message, context = undefined) {
  if (condition) return;
  const suffix = context === undefined ? '' : `\nContext: ${JSON.stringify(context, null, 2)}`;
  throw new Error(`${message}${suffix}`);
}

async function fetchManual(url, options = {}) {
  return fetch(url, { redirect: 'manual', ...options });
}

function extractCanonical(html) {
  const direct = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const reverse = html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return direct?.[1] || reverse?.[1] || null;
}

function extractSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
}

async function expectPermanentRedirect(origin, path) {
  const response = await fetchManual(`${origin}${path}`);
  assert([301, 308].includes(response.status), 'Expected a permanent redirect', {
    origin,
    path,
    status: response.status,
    location: response.headers.get('location'),
  });
  const location = response.headers.get('location');
  assert(location, 'Redirect is missing Location header', { origin, path });
  const target = new URL(location, origin);
  assert(target.origin === CANONICAL_ORIGIN, 'Redirect target must use canonical apex origin', { origin, path, location });
  assert(`${target.pathname}${target.search}` === path, 'Redirect must preserve path and query string', { origin, path, location });
}

async function checkHtml(path) {
  const response = await fetchManual(`${CANONICAL_ORIGIN}${path}`);
  assert(response.status === 200, 'Canonical page must return HTTP 200', { path, status: response.status });
  const html = await response.text();
  const canonical = extractCanonical(html);
  assert(canonical, 'Canonical page is missing rel=canonical', { path });
  const canonicalUrl = new URL(canonical, CANONICAL_ORIGIN);
  assert(canonicalUrl.protocol === 'https:', 'Canonical must use HTTPS', { path, canonical });
  assert(canonicalUrl.origin === CANONICAL_ORIGIN, 'Canonical must use gameyer.az apex host', { path, canonical });
  assert(canonicalUrl.pathname === new URL(`${CANONICAL_ORIGIN}${path}`).pathname, 'Canonical path must match current page', { path, canonical });
  assert(!/gameyerr-gameyer\.vercel\.app|bosyer-web\.vercel\.app|bosyer/i.test(html), 'Legacy host/brand leaked into canonical HTML', { path });
  return html;
}

async function main() {
  const health = await fetchManual(`${CANONICAL_ORIGIN}/api/health`);
  assert(health.status === 200, 'Health endpoint must return HTTP 200', { status: health.status });
  const healthPayload = await health.json();
  assert(healthPayload?.ok === true && healthPayload?.database === 'ok', 'Health endpoint must report healthy app/database', healthPayload);

  const robotsResponse = await fetchManual(`${CANONICAL_ORIGIN}/robots.txt`);
  assert(robotsResponse.status === 200, 'robots.txt must return HTTP 200', { status: robotsResponse.status });
  const robots = await robotsResponse.text();
  assert(robots.includes(`Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`), 'robots.txt must advertise canonical sitemap', robots);
  assert(!/gameyerr-gameyer\.vercel\.app|bosyer-web\.vercel\.app|bosyer/i.test(robots), 'Legacy host leaked into robots.txt', robots);

  const sitemapResponse = await fetchManual(`${CANONICAL_ORIGIN}/sitemap.xml`);
  assert(sitemapResponse.status === 200, 'sitemap.xml must return HTTP 200', { status: sitemapResponse.status });
  const sitemap = await sitemapResponse.text();
  const urls = extractSitemapUrls(sitemap);
  assert(urls.length > 0, 'sitemap.xml must contain URLs');
  for (const value of urls) {
    const url = new URL(value);
    assert(url.protocol === 'https:' && url.origin === CANONICAL_ORIGIN, 'Every sitemap URL must use https://gameyer.az', { value });
  }

  const representativePaths = ['/', '/bakida-pc-klublari', '/bakida-playstation-klublari', '/bakida-24-saat-gaming-klublari', '/bakida-internet-klublari', '/bakida-gaming-klub-qiymetleri', '/rayon', '/tip', '/haqqimizda', '/elaqe', '/klub-sahibi'];
  const firstClub = urls.map((value) => new URL(value).pathname).find((path) => path.startsWith('/klub/'));
  const firstDistrict = urls.map((value) => new URL(value).pathname).find((path) => /^\/rayon\/[^/]+$/.test(path));
  if (firstClub) representativePaths.push(firstClub);
  if (firstDistrict) representativePaths.push(firstDistrict);

  for (const path of representativePaths) await checkHtml(path);

  for (const origin of [WWW_ORIGIN, ...LEGACY_ORIGINS]) {
    await expectPermanentRedirect(origin, '/');
    if (firstClub) await expectPermanentRedirect(origin, `${firstClub}?cutover=1`);
  }

  const admin = await fetchManual(`${CANONICAL_ORIGIN}/admin/login`);
  assert(admin.status === 200, 'Admin login must remain reachable', { status: admin.status });
  const adminHtml = await admin.text();
  assert(/<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]*>/i.test(adminHtml) || /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(adminHtml), 'Admin login must remain noindex');

  const homepage = await fetchManual(`${CANONICAL_ORIGIN}/`);
  const requiredHeaders = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
  };
  for (const [key, expected] of Object.entries(requiredHeaders)) {
    assert(homepage.headers.get(key) === expected, `Missing/incorrect ${key}`, { actual: homepage.headers.get(key), expected });
  }
  assert(homepage.headers.get('strict-transport-security')?.includes('max-age=31536000'), 'HSTS must remain enabled', { value: homepage.headers.get('strict-transport-security') });

  console.log(`gameyer.az cutover smoke passed: ${urls.length} sitemap URLs; ${representativePaths.length} representative pages; apex/www/${LEGACY_ORIGINS.length} legacy host routes verified.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
