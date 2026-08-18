import process from 'node:process';

const BASE_URL = (process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const EXPECTED_CANONICAL_ORIGIN = (process.env.EXPECTED_CANONICAL_ORIGIN || 'https://gameyer.az').replace(/\/$/, '');

function assert(condition, message, context = undefined) {
  if (!condition) {
    const suffix = context === undefined ? '' : `\nContext: ${JSON.stringify(context, null, 2)}`;
    throw new Error(`${message}${suffix}`);
  }
}

function absolute(path) {
  return new URL(path, `${BASE_URL}/`).toString();
}

async function fetchText(path, options = {}) {
  const response = await fetch(absolute(path), { redirect: 'manual', ...options });
  const text = await response.text();
  return { response, text };
}

function extractSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
}

function extractInternalHrefs(html) {
  return [...html.matchAll(/href=["']([^"']+)["']/gi)]
    .map((match) => match[1].trim())
    .filter((href) => href.startsWith('/') && !href.startsWith('//'))
    .map((href) => href.split('#')[0])
    .filter(Boolean);
}

function extractIds(html) {
  return [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]);
}

function duplicateValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value, count]) => ({ value, count }));
}

function canonicalHref(html) {
  const matches = [...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
  if (matches.length === 1) return { count: 1, href: matches[0][1] };

  const reverseOrder = [...html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/gi)];
  const combined = [...matches, ...reverseOrder];
  return { count: combined.length, href: combined[0]?.[1] || null };
}

function metaRobots(html) {
  const direct = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (direct) return direct[1];
  const reverse = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*>/i);
  return reverse?.[1] || '';
}

async function checkHealth() {
  const { response, text } = await fetchText('/api/health');
  assert(response.status === 200, 'Health endpoint must return HTTP 200', { status: response.status, text });
  const payload = JSON.parse(text);
  assert(payload?.ok === true && payload?.database === 'ok', 'Health endpoint must report healthy database', payload);
}

async function checkRobotsAndSitemap() {
  const robots = await fetchText('/robots.txt');
  assert(robots.response.status === 200, 'robots.txt must return HTTP 200', { status: robots.response.status });
  assert(!/disallow:\s*\/$/im.test(robots.text), 'robots.txt must not block the whole site', robots.text);
  assert(/sitemap:/i.test(robots.text), 'robots.txt must advertise a sitemap', robots.text);
  assert(robots.text.includes(`${EXPECTED_CANONICAL_ORIGIN}/sitemap.xml`), 'robots.txt must advertise the canonical gameyer.az sitemap', robots.text);

  const sitemap = await fetchText('/sitemap.xml');
  assert(sitemap.response.status === 200, 'sitemap.xml must return HTTP 200', { status: sitemap.response.status });
  const urls = extractSitemapUrls(sitemap.text);
  assert(urls.length > 0, 'sitemap.xml must contain at least one URL');
  const duplicates = duplicateValues(urls);
  assert(duplicates.length === 0, 'sitemap.xml contains duplicate URLs', duplicates);
  assert(urls.every((url) => new URL(url).origin === EXPECTED_CANONICAL_ORIGIN), 'Every sitemap URL must use gameyer.az canonical origin', urls.filter((url) => new URL(url).origin !== EXPECTED_CANONICAL_ORIGIN));
  assert(urls.some((url) => new URL(url).pathname.startsWith('/klub/')), 'sitemap.xml must contain club detail pages', urls.slice(0, 10));
  return urls;
}

async function checkHtmlPage(url) {
  const target = new URL(url);
  const path = `${target.pathname}${target.search}`;
  const { response, text } = await fetchText(path);
  assert(response.status === 200, 'Sitemap page must return HTTP 200', { path, status: response.status, location: response.headers.get('location') });
  assert(/<!doctype html>|<html[\s>]/i.test(text), 'Sitemap URL must return HTML', { path, contentType: response.headers.get('content-type') });
  assert(/<title>[^<]+<\/title>/i.test(text), 'Page must have a non-empty title', { path });
  assert(/<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i.test(text) || /<meta[^>]+content=["'][^"']+["'][^>]+name=["']description["']/i.test(text), 'Page must have a meta description', { path });

  const robots = metaRobots(text).toLowerCase();
  assert(!robots.includes('noindex'), 'Public sitemap page must not be noindex', { path, robots });

  const canonical = canonicalHref(text);
  assert(canonical.count === 1, 'Page must have exactly one canonical URL', { path, canonical });
  const canonicalUrl = new URL(canonical.href, target.origin);
  assert(canonicalUrl.origin === EXPECTED_CANONICAL_ORIGIN, 'Canonical origin must be gameyer.az', { path, canonical: canonical.href });
  assert(canonicalUrl.pathname === target.pathname, 'Canonical pathname must match sitemap pathname', { path, canonical: canonical.href });

  const duplicateIds = duplicateValues(extractIds(text));
  assert(duplicateIds.length === 0, 'Rendered HTML contains duplicate element IDs', { path, duplicateIds });

  return text;
}

async function checkInternalLinks(homeHtml) {
  const hrefs = [...new Set(extractInternalHrefs(homeHtml))];
  const failures = [];
  for (const href of hrefs) {
    const response = await fetch(absolute(href), { redirect: 'manual' });
    if (response.status >= 400 || response.status === 0) failures.push({ href, status: response.status });
  }
  assert(failures.length === 0, 'Homepage contains broken internal links', failures);
}

await checkHealth();
const sitemapUrls = await checkRobotsAndSitemap();

let homeHtml = '';
for (const url of sitemapUrls) {
  const html = await checkHtmlPage(url);
  if (new URL(url).pathname === '/') homeHtml = html;
}

if (!homeHtml) homeHtml = await checkHtmlPage(absolute('/'));
await checkInternalLinks(homeHtml);

console.log(`Site integrity smoke passed for ${sitemapUrls.length} sitemap URLs on ${EXPECTED_CANONICAL_ORIGIN}.`);
