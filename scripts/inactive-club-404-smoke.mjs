import process from 'node:process';

const BASE_URL = (process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

function assert(condition, message, context = undefined) {
  if (!condition) {
    const suffix = context === undefined ? '' : `\nContext: ${JSON.stringify(context, null, 2)}`;
    throw new Error(`${message}${suffix}`);
  }
}

async function fetchPage(path) {
  const response = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' });
  const text = await response.text();
  return { response, text };
}

const inactive = await fetchPage('/klub/vegas-gaming-center-xezer');
assert(inactive.response.status === 404, 'Known inactive club slug must return HTTP 404', {
  status: inactive.response.status,
  location: inactive.response.headers.get('location'),
});
assert(inactive.text.includes('Klub tapılmadı'), 'Inactive club 404 must keep the public not-found UI');
assert(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(inactive.text) || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(inactive.text), 'Inactive club 404 must remain noindex');

const unknown = await fetchPage('/klub/__gameyer_missing_club_regression__');
assert(unknown.response.status === 404, 'Unknown club slug must return HTTP 404', {
  status: unknown.response.status,
  location: unknown.response.headers.get('location'),
});

const active = await fetchPage('/klub/milli-gaming-arena');
assert(active.response.status === 200, 'Known active club slug must remain HTTP 200', {
  status: active.response.status,
  location: active.response.headers.get('location'),
});

console.log('Inactive club hard-404 smoke PASS (inactive=404, unknown=404, active=200).');
