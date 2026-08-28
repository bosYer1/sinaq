import process from 'node:process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

function assert(condition, message, context = {}) {
  if (!condition) throw new Error(`${message}\nContext: ${JSON.stringify(context, null, 2)}`);
}

async function get(path) {
  const response = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' });
  return {
    status: response.status,
    robots: response.headers.get('x-robots-tag'),
  };
}

for (const basePath of ['/klub-sahibi', '/elaqe']) {
  const base = await get(basePath);
  assert(base.status >= 200 && base.status < 300, `${basePath}: base page is not successful`, base);
  assert(!base.robots?.toLowerCase().includes('noindex'), `${basePath}: base page must remain indexable`, base);
}

for (const path of [
  '/klub-sahibi?club=Smoke',
  '/klub-sahibi?slug=smoke',
  '/elaqe?sent=1',
  '/elaqe?error=1',
]) {
  const state = await get(path);
  assert(state.status >= 200 && state.status < 300, `${path}: utility state page is not successful`, state);
  const robots = state.robots?.toLowerCase() ?? '';
  assert(robots.includes('noindex') && robots.includes('follow'), `${path}: utility state must return X-Robots-Tag noindex, follow`, state);
}

console.log('SEO utility query-state header regression passed.');
