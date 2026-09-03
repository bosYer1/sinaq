import process from 'node:process';

const BASE_URL = (process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const EXPECTED_CANONICAL_ORIGIN = (process.env.EXPECTED_CANONICAL_ORIGIN || 'https://gameyer.az').replace(/\/$/, '');

function assert(condition, message, context = undefined) {
  if (!condition) {
    const suffix = context === undefined ? '' : `\nContext: ${JSON.stringify(context, null, 2)}`;
    throw new Error(`${message}${suffix}`);
  }
}

async function fetchText(path) {
  const response = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' });
  return { response, text: await response.text() };
}

function metaRobots(html) {
  const direct = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (direct) return direct[1];
  const reverse = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*>/i);
  return reverse?.[1] || '';
}

function canonicalHref(html) {
  const direct = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (direct) return direct[1];
  const reverse = html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  return reverse?.[1] || null;
}

const knownPath = '/rayon/binaqadi';
const known = await fetchText(knownPath);
assert(known.response.status === 200, 'A known district route must stay usable even when it has no active clubs', {
  path: knownPath,
  status: known.response.status,
  location: known.response.headers.get('location'),
});

const canonical = canonicalHref(known.text);
assert(canonical && new URL(canonical, EXPECTED_CANONICAL_ORIGIN).href === `${EXPECTED_CANONICAL_ORIGIN}${knownPath}`, 'Known district route must keep its clean self-canonical', { canonical });

const isEmptyState = known.text.includes('data-district-state="empty"');
const robots = metaRobots(known.text).toLowerCase();
if (isEmptyState) {
  assert(robots.includes('noindex') && robots.includes('follow'), 'Known empty district must be noindex,follow', { robots });
  assert(known.text.includes('Məlumat hazırlanır'), 'Known empty district must explain that data is being prepared');
  assert(known.text.includes('href="/rayon"'), 'Known empty district must link back to active districts');
  assert(known.text.includes('href="/yaxinliqda-gaming-klublari"'), 'Known empty district must offer nearby club discovery');
} else {
  assert(!robots.includes('noindex'), 'A district with active clubs must remain indexable', { robots });
  assert(/<h1(?:\s|>)/i.test(known.text), 'Active district page must render an H1');
}

const missingPath = '/rayon/__gameyer_missing_district_regression__';
const missing = await fetchText(missingPath);
assert(missing.response.status === 404, 'An unknown district slug must remain a real 404', {
  path: missingPath,
  status: missing.response.status,
  location: missing.response.headers.get('location'),
});

console.log(`Known district route regression: PASS (${isEmptyState ? 'empty/noindex' : 'active/indexable'}).`);
