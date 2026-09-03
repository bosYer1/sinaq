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

function metaContent(html, attribute, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const direct = html.match(new RegExp(`<meta[^>]+${attribute}=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i'));
  if (direct) return direct[1];
  const reverse = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*${attribute}=["']${escaped}["'][^>]*>`, 'i'));
  return reverse?.[1] || '';
}

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1].trim());
}

function stripHtmlComments(html) {
  let output = '';
  let cursor = 0;

  while (cursor < html.length) {
    const start = html.indexOf('<!--', cursor);
    if (start === -1) return output + html.slice(cursor);

    output += html.slice(cursor, start);
    const end = html.indexOf('-->', start + 4);
    if (end === -1) return output;
    cursor = end + 3;
  }

  return output;
}

function homepageClubCounts(html) {
  const normalized = stripHtmlComments(html);
  const summaryCount = normalized.match(/🎮<\/span>\s*(\d+)\s*klub/i)?.[1];
  const listCounts = [...normalized.matchAll(/Klublar\s*\(\s*(\d+)\s*\)/gi)].map((match) => Number(match[1]));
  return {
    summary: summaryCount ? Number(summaryCount) : null,
    lists: listCounts,
  };
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
  assert(urls.every((url) => !new URL(url).search && !new URL(url).hash), 'Sitemap URLs must not contain query strings or fragments', urls.filter((url) => new URL(url).search || new URL(url).hash));
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
  assert(!canonicalUrl.search && !canonicalUrl.hash, 'Canonical URL must not contain a query string or fragment', { path, canonical: canonical.href });

  const lang = text.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1];
  assert(lang === 'az', 'Public HTML must declare Azerbaijani language', { path, lang });
  const h1Count = [...text.matchAll(/<h1(?:\s|>)/gi)].length;
  assert(h1Count === 1, 'Every sitemap page must render exactly one H1', { path, h1Count });
  assert(Boolean(metaContent(text, 'property', 'og:title')), 'Page must expose an Open Graph title', { path });
  assert(Boolean(metaContent(text, 'property', 'og:description')), 'Page must expose an Open Graph description', { path });

  const jsonLd = jsonLdBlocks(text);
  assert(jsonLd.length > 0, 'Every sitemap page must expose JSON-LD', { path });
  for (const [index, block] of jsonLd.entries()) {
    try {
      JSON.parse(block);
    } catch (error) {
      throw new Error(`Invalid JSON-LD on ${path} at block ${index + 1}: ${error.message}`);
    }
  }

  const duplicateIds = duplicateValues(extractIds(text));
  assert(duplicateIds.length === 0, 'Rendered HTML contains duplicate element IDs', { path, duplicateIds });

  return text;
}

async function checkParameterizedHomeIsNotIndexable() {
  for (const query of ['?district=nesimi', '?type=pc', '?price_max=3', '?q=gaming', '?view=map']) {
    const { response, text } = await fetchText(`/${query}`);
    assert(response.status === 200, 'Parameterized homepage must remain usable', { query, status: response.status });
    assert(metaRobots(text).toLowerCase().includes('noindex'), 'Parameterized homepage must be noindex', { query, robots: metaRobots(text) });
    const canonical = canonicalHref(text);
    assert(canonical.count === 1 && new URL(canonical.href, EXPECTED_CANONICAL_ORIGIN).href === `${EXPECTED_CANONICAL_ORIGIN}/`, 'Parameterized homepage must canonicalize to the clean homepage', { query, canonical });
  }
}

async function checkParameterizedClubOwnerIsNotIndexable() {
  const clean = await fetchText('/klub-sahibi');
  assert(clean.response.status === 200, 'Clean club-owner page must remain usable', { status: clean.response.status });
  assert(!metaRobots(clean.text).toLowerCase().includes('noindex'), 'Clean club-owner page must remain indexable', { robots: metaRobots(clean.text) });

  for (const query of ['?club=Regression+Club&slug=regression-club', '?sent=1', '?error=1', '?rate=1']) {
    const { response, text } = await fetchText(`/klub-sahibi${query}`);
    assert(response.status === 200, 'Parameterized club-owner page must remain usable', { query, status: response.status });
    assert(metaRobots(text).toLowerCase().includes('noindex'), 'Parameterized club-owner page must be noindex', { query, robots: metaRobots(text) });
    const canonical = canonicalHref(text);
    assert(canonical.count === 1 && new URL(canonical.href, EXPECTED_CANONICAL_ORIGIN).href === `${EXPECTED_CANONICAL_ORIGIN}/klub-sahibi`, 'Parameterized club-owner page must canonicalize to the clean club-owner page', { query, canonical });
  }
}

async function checkInternalLinks(pageHtmlByPath) {
  const sourcesByHref = new Map();
  for (const [sourcePath, html] of pageHtmlByPath.entries()) {
    for (const href of extractInternalHrefs(html)) {
      if (!sourcesByHref.has(href)) sourcesByHref.set(href, new Set());
      sourcesByHref.get(href).add(sourcePath);
    }
  }

  const failures = [];
  for (const [href, sources] of sourcesByHref.entries()) {
    const response = await fetch(absolute(href), { redirect: 'manual' });
    if (response.status >= 400 || response.status === 0) {
      failures.push({ href, status: response.status, sources: [...sources].slice(0, 5) });
    }
  }
  assert(failures.length === 0, 'Public sitemap pages contain broken internal links', failures);
}

function checkHomepageClubCount(homeHtml, sitemapUrls) {
  const expected = sitemapUrls.filter((url) => new URL(url).pathname.startsWith('/klub/')).length;
  const rendered = homepageClubCounts(homeHtml);
  assert(expected > 0, 'Sitemap must expose public club detail URLs before count consistency can be checked');
  assert(rendered.summary === expected, 'Homepage summary club count must match public sitemap clubs', { expected, rendered });
  assert(rendered.lists.length > 0, 'Homepage must render at least one club list count', { expected, rendered });
  assert(rendered.lists.every((count) => count === expected), 'Every homepage club list count must match public sitemap clubs', { expected, rendered });
}

await checkHealth();
const sitemapUrls = await checkRobotsAndSitemap();

const pageHtmlByPath = new Map();
let homeHtml = '';
for (const url of sitemapUrls) {
  const html = await checkHtmlPage(url);
  const pathname = new URL(url).pathname;
  pageHtmlByPath.set(pathname, html);
  if (pathname === '/') homeHtml = html;
}

if (!homeHtml) {
  homeHtml = await checkHtmlPage(absolute('/'));
  pageHtmlByPath.set('/', homeHtml);
}
checkHomepageClubCount(homeHtml, sitemapUrls);
await checkInternalLinks(pageHtmlByPath);
await checkParameterizedHomeIsNotIndexable();
await checkParameterizedClubOwnerIsNotIndexable();

console.log(`Site integrity smoke passed for ${sitemapUrls.length} sitemap URLs on ${EXPECTED_CANONICAL_ORIGIN}.`);
