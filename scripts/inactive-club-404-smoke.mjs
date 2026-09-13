import process from 'node:process';

const BASE_URL = (process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

const INACTIVE_INDEXED_SLUGS = [
  'alfa-rooms',
  'e-s-club-playstation',
  'fun-drive-baku-game-club',
  'game-stop-playstation-club',
  'gamer-hall-baku',
  'gamezone-internet-klub',
  'good-game-genclik',
  'haven-cyber-lounge',
  'next-level-cyberclub',
  'playstation-club-bakixanov-yavar-aliyev',
  'playstation-home-qara-qarayev',
  'prime-cyberclub',
  'real-club-playstation',
  'vegas-gaming-center-xezer',
  'x-game-arena',
];

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

for (const slug of INACTIVE_INDEXED_SLUGS) {
  const inactive = await fetchPage(`/klub/${slug}`);
  assert(inactive.response.status === 404, 'Known indexed inactive club slug must return HTTP 404', {
    slug,
    status: inactive.response.status,
    location: inactive.response.headers.get('location'),
  });
  assert(inactive.text.includes('Klub tapılmadı'), 'Inactive club 404 must keep a clear public not-found message', { slug });
  assert(inactive.response.headers.get('x-robots-tag')?.toLowerCase().includes('noindex'), 'Inactive club 404 must send X-Robots-Tag noindex', {
    slug,
    robots: inactive.response.headers.get('x-robots-tag'),
  });
}

const active = await fetchPage('/klub/milli-gaming-arena');
assert(active.response.status === 200, 'Known active club slug must remain HTTP 200', {
  status: active.response.status,
  location: active.response.headers.get('location'),
});

console.log(`Inactive club hard-404 smoke PASS (${INACTIVE_INDEXED_SLUGS.length} indexed inactive slugs=404, active=200).`);
