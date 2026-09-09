const BASE_URL = (process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const OSM_TILE_ORIGIN = 'https://tile.openstreetmap.org';

function assert(condition, message, context = undefined) {
  if (condition) return;
  const suffix = context === undefined ? '' : `\nContext: ${JSON.stringify(context, null, 2)}`;
  throw new Error(`${message}${suffix}`);
}

function htmlLinkHints(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => {
    const attributes = {};
    for (const match of tag.matchAll(/\b(rel|href)\s*=\s*["']([^"']*)["']/gi)) {
      attributes[match[1].toLowerCase()] = match[2];
    }
    return attributes;
  });
}

function hasHtmlHint(hints, rel) {
  return hints.some((hint) => hint.rel?.toLowerCase() === rel && hint.href?.replace(/\/$/, '') === OSM_TILE_ORIGIN);
}

function hasHeaderHint(linkHeader, rel) {
  return linkHeader.split(',').some((entry) => {
    const start = entry.indexOf('<');
    const end = entry.indexOf('>', start + 1);
    if (start < 0 || end < 0) return false;
    const target = entry.slice(start + 1, end).trim().replace(/\/$/, '');
    if (target !== OSM_TILE_ORIGIN) return false;

    return entry.slice(end + 1).split(';').some((parameter) => {
      const equals = parameter.indexOf('=');
      if (equals < 0) return false;
      const name = parameter.slice(0, equals).trim().toLowerCase();
      const value = parameter.slice(equals + 1).trim().replace(/^["']|["']$/g, '').toLowerCase();
      return name === 'rel' && value.split(/\s+/).includes(rel);
    });
  });
}

const response = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
const html = await response.text();
const linkHeader = response.headers.get('link') || '';
const hints = htmlLinkHints(html);

assert(response.status === 200, 'Homepage must return HTTP 200 before resource hints are checked', { status: response.status });

const dnsPrefetch = hasHtmlHint(hints, 'dns-prefetch') || hasHeaderHint(linkHeader, 'dns-prefetch');
const preconnect = hasHtmlHint(hints, 'preconnect') || hasHeaderHint(linkHeader, 'preconnect');
const context = {
  linkHeader,
  osmHtmlHints: hints.filter((hint) => hint.href?.includes('tile.openstreetmap.org')),
};

assert(dnsPrefetch, 'Homepage response must DNS-prefetch the OpenStreetMap tile origin', context);
assert(preconnect, 'Homepage response must preconnect to the OpenStreetMap tile origin', context);

console.log('OSM resource hint regression: PASS');
