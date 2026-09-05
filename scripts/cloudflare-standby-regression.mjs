import assert from 'node:assert/strict';

async function loadConfig(mode, cacheKey) {
  process.env.CLOUDFLARE_STANDBY = mode;
  return (await import(`../next.config.js?mode=${cacheKey}`)).default;
}

const standby = await loadConfig('1', 'standby');
const standbyHeaders = await standby.headers();
const standbyGlobal = standbyHeaders.find((entry) => entry.source === '/:path*');
const standbyRoot = standbyHeaders.find((entry) => entry.source === '/');

assert.equal(standby.images?.unoptimized, true);
assert.ok(
  standbyGlobal?.headers.some(
    (header) => header.key === 'X-Robots-Tag' && header.value === 'noindex, nofollow, noarchive',
  ),
  'Cloudflare standby must emit a global noindex header',
);
assert.ok(
  standbyRoot?.headers.some(
    (header) => header.key === 'X-Robots-Tag' && header.value === 'noindex, nofollow, noarchive',
  ),
  'Cloudflare standby root must emit a noindex header',
);

const primary = await loadConfig('0', 'primary');
const primaryHeaders = await primary.headers();
const primaryGlobal = primaryHeaders.find((entry) => entry.source === '/:path*');
const primaryRoot = primaryHeaders.find((entry) => entry.source === '/');

assert.equal(primary.images?.unoptimized, false);
assert.equal(
  primaryGlobal?.headers.some((header) => header.key === 'X-Robots-Tag'),
  false,
  'Vercel production must keep its existing indexing behavior',
);
assert.equal(primaryRoot, undefined, 'Vercel production must not receive a standby-only root header rule');

console.log('Cloudflare standby noindex isolation regression passed.');
