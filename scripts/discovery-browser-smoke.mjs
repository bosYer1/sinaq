import { spawn } from 'node:child_process';
import process from 'node:process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const CHROME_BIN = process.env.CHROME_BIN;
const PORT = Number(process.env.DISCOVERY_CDP_PORT || 9333);
if (!CHROME_BIN) throw new Error('CHROME_BIN is required');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message, context) => { if (!condition) throw new Error(`${message}\n${JSON.stringify(context ?? {}, null, 2)}`); };

const chrome = spawn(CHROME_BIN, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/gameyer-discovery-chrome', 'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });
let chromeLog = '';
chrome.stdout.on('data', (chunk) => { chromeLog += chunk.toString(); });
chrome.stderr.on('data', (chunk) => { chromeLog += chunk.toString(); });

for (let i = 0; i < 60; i += 1) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  if (i === 59) throw new Error(`Chrome did not start\n${chromeLog}`);
  await sleep(250);
}

const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let id = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data));
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const requestId = ++id;
  pending.set(requestId, { resolve, reject });
  ws.send(JSON.stringify({ id: requestId, method, params }));
});
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result?.value;
};
const wait = async (expression, label) => {
  for (let i = 0; i < 80; i += 1) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}`);
};
const navigate = async (path) => {
  await send('Page.navigate', { url: `${BASE_URL}${path}` });
  await wait(`document.readyState === 'complete'`, `navigate ${path}`);
  await sleep(400);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Network.setBlockedURLs', {
  urls: [
    '*/api/analytics/visit*',
    '*posthog.com/*',
    '*posthog.com*',
    '*googletagmanager.com/*',
    '*google-analytics.com/*',
    '*connect.facebook.net/*',
    '*facebook.com/tr/*',
  ],
});
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `
    window.__gameyerCapturedEvents = [];
    window.posthog = {
      __loaded: true,
      init() {},
      register_once() {},
      capture(event, properties) {
        window.__gameyerCapturedEvents.push({ event, properties });
      },
    };
  `,
});
try {
  await send('Browser.setPermission', {
    origin: BASE_URL,
    permission: { name: 'geolocation' },
    setting: 'denied',
  });
} catch {
  // Older Chromium builds may not expose Browser.setPermission; map behavior is still tested below.
}

try {
  await navigate('/');
  await wait(`Boolean(document.querySelector('input[aria-label="Klub axtar"]'))`, 'search input');
  const initial = await evaluate(`(() => {
    return {
      count: document.body.innerText.match(/Klublar \\((\\d+)\\)/)?.[1] || document.body.innerText.match(/(\\d+) klub/)?.[1] || null,
      districtSlug: Array.from(document.querySelectorAll('a[href^="/rayon/"]')).map((a) => a.getAttribute('href')?.split('/').filter(Boolean).pop()).find(Boolean) || null,
    };
  })()`);
  assert(initial.count, 'Homepage club count missing', initial);
  assert(initial.districtSlug, 'No active district available for regression', initial);

  const clubViewTarget = await evaluate(`Array.from(document.querySelectorAll('a[href^="/klub/"]')).find((anchor) => {
    const rect = anchor.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  })?.getAttribute('href') || null`);
  assert(clubViewTarget?.startsWith('/klub/'), 'No visible club card available for analytics regression', { clubViewTarget });
  await navigate(clubViewTarget);
  await wait(`window.__gameyerCapturedEvents.some((entry) => entry.event === 'club_view')`, 'club_view PostHog capture');
  const clubViewCapture = await evaluate(`(() => {
    const capture = window.__gameyerCapturedEvents.find((entry) => entry.event === 'club_view');
    return {
      path: location.pathname,
      event: capture?.event || null,
      properties: capture?.properties || null,
    };
  })()`);
  assert(clubViewCapture.event === 'club_view', 'Club detail did not emit club_view', clubViewCapture);
  assert(clubViewCapture.properties?.club_slug === clubViewCapture.path.split('/').filter(Boolean).pop(), 'club_view slug attribution does not match the opened detail page', clubViewCapture);
  assert(clubViewCapture.properties?.gameyer_traffic_scope === 'public', 'club_view must keep the public analytics scope marker', clubViewCapture);

  await navigate('/');
  await wait(`Boolean(document.querySelector('input[aria-label="Klub axtar"]'))`, 'search input after club view regression');
  const hasSearchTerm = await evaluate(`(() => {
    const visibleClub = Array.from(document.querySelectorAll('a[href^="/klub/"]')).find((anchor) => {
      const rect = anchor.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    window.__gameyerSearchTerm = visibleClub?.querySelector('h3')?.textContent?.trim() || '';
    return Boolean(window.__gameyerSearchTerm);
  })()`);
  assert(hasSearchTerm, 'No visible club name available for search analytics regression');
  await evaluate(`(() => {
    const input = document.querySelector('input[aria-label="Klub axtar"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, window.__gameyerSearchTerm);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await wait(`new URLSearchParams(location.search).get('q') === window.__gameyerSearchTerm`, 'nonzero search URL update');
  await wait(`window.__gameyerCapturedEvents.some((entry) => entry.event === 'search_query' && entry.properties?.search_query === window.__gameyerSearchTerm && Number.isInteger(entry.properties?.result_count) && entry.properties.result_count > 0 && entry.properties?.no_results === false)`, 'nonzero search analytics capture');
  const nonzeroSearchAnalytics = await evaluate(`window.__gameyerCapturedEvents.find((entry) => entry.event === 'search_query' && entry.properties?.search_query === window.__gameyerSearchTerm)?.properties || null`);
  assert(nonzeroSearchAnalytics?.result_count > 0 && nonzeroSearchAnalytics?.no_results === false, 'Nonzero search analytics result contract failed', nonzeroSearchAnalytics);

  await navigate('/');
  await wait(`Boolean(document.querySelector('input[aria-label="Klub axtar"]'))`, 'search input before rapid typing regression');
  await evaluate(`(async () => {
    const input = document.querySelector('input[aria-label="Klub axtar"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    input.focus();
    for (const nextValue of ['g', 'ga', 'gam', 'game', 'gamey', 'gameye', 'gameyer']) {
      setter.call(input, nextValue);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 340));
    }
    return true;
  })()`);
  await wait(`document.querySelector('input[aria-label="Klub axtar"]')?.value === 'gameyer'`, 'rapid search input preserves latest text');
  await wait(`new URLSearchParams(location.search).get('q') === 'gameyer'`, 'rapid search URL catches up to latest text');
  await sleep(500);
  const rapidSearchState = await evaluate(`(() => ({
    value: document.querySelector('input[aria-label="Klub axtar"]')?.value || '',
    query: new URLSearchParams(location.search).get('q'),
    focused: document.activeElement === document.querySelector('input[aria-label="Klub axtar"]'),
  }))()`);
  assert(rapidSearchState.value === 'gameyer' && rapidSearchState.query === 'gameyer', 'Rapid search typing was overwritten by an older route response', rapidSearchState);

  await evaluate(`(() => {
    const input = document.querySelector('input[aria-label="Klub axtar"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, '__definitely_no_real_club__');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await wait(`location.search.includes('q=__definitely_no_real_club__')`, 'search query URL update');
  await wait(`document.body.innerText.includes('Nəticə tapılmadı') || document.body.innerText.includes('klub tapılmadı') || document.body.innerText.includes('0 klub')`, 'search no-results state');
  await wait(`window.__gameyerCapturedEvents.some((entry) => entry.event === 'search_query' && entry.properties?.search_query === '__definitely_no_real_club__' && entry.properties?.result_count === 0 && entry.properties?.no_results === true)`, 'zero-result search analytics capture');
  const zeroResultSearchAnalytics = await evaluate(`window.__gameyerCapturedEvents.find((entry) => entry.event === 'search_query' && entry.properties?.search_query === '__definitely_no_real_club__')?.properties || null`);
  assert(zeroResultSearchAnalytics?.result_count === 0 && zeroResultSearchAnalytics?.no_results === true, 'Zero-result search analytics result contract failed', zeroResultSearchAnalytics);

  await navigate('/?type=pc');
  const pcState = await evaluate(`(() => ({
    pressed: Array.from(document.querySelectorAll('button[aria-pressed="true"]')).map((b) => b.textContent?.trim()),
    noindex: document.querySelector('meta[name="robots"]')?.content || '',
    canonical: document.querySelector('link[rel="canonical"]')?.href || '',
  }))()`);
  assert(pcState.pressed.length > 0, 'Type filter did not activate', pcState);
  assert(pcState.noindex.toLowerCase().includes('noindex'), 'Filtered homepage must be noindex', pcState);
  assert(pcState.canonical === 'https://gameyer.az/' || pcState.canonical === `${BASE_URL}/`, 'Filtered homepage canonical regressed', pcState);

  await navigate(`/?district=${encodeURIComponent(initial.districtSlug)}`);
  const activeDistrict = await evaluate(`new URLSearchParams(location.search).get('district')`);
  assert(activeDistrict === initial.districtSlug, 'District filter query did not remain active', { expected: initial.districtSlug, actual: activeDistrict });
  assert(await evaluate(`document.querySelector('meta[name="robots"]')?.content?.toLowerCase().includes('noindex')`), 'District-filtered homepage must remain noindex');

  await navigate('/?price_max=2');
  assert(await evaluate(`location.search.includes('price_max=2')`), 'Price filter query did not remain active');

  await navigate('/?view=map');
  await wait(`Boolean(document.querySelector('[aria-label="GameYer klub xəritəsi"]'))`, 'map view');
  const map = await evaluate(`(() => {
    const el = document.querySelector('[aria-label="GameYer klub xəritəsi"]');
    const rect = el?.getBoundingClientRect();
    return { exists: Boolean(el), width: rect?.width || 0, height: rect?.height || 0, bodyText: document.body.innerText.slice(0, 3000) };
  })()`);
  assert(map.exists && map.width > 250 && map.height > 300, 'Map view failed to render with geolocation denied', map);
  assert(!/undefined|cannot read properties|null is not an object/i.test(map.bodyText), 'Map view exposed a runtime failure after denied geolocation', map);

  const markerCount = await evaluate(`document.querySelectorAll('.leaflet-marker-icon').length`);
  assert(markerCount > 0, 'Map rendered without club markers', { markerCount });
  await evaluate(`document.querySelector('.leaflet-marker-icon')?.click()`);
  await sleep(350);
  const popupClubHref = await evaluate(`Array.from(document.querySelectorAll('.leaflet-popup a[href^="/klub/"], a[href^="/klub/"]')).map((a) => a.getAttribute('href')).find(Boolean) || null`);
  assert(popupClubHref?.startsWith('/klub/'), 'Marker click did not expose a club detail destination', { popupClubHref });

  await navigate(popupClubHref);
  await wait(`Boolean(document.querySelector('h1'))`, 'club detail after marker navigation');
  const detailState = await evaluate(`({ path: location.pathname, heading: document.querySelector('h1')?.textContent?.trim() || '' })`);
  assert(detailState.path === popupClubHref && detailState.heading.length > 0, 'Marker destination did not render a club detail page', detailState);
  await evaluate(`history.back()`);
  await wait(`location.search.includes('view=map')`, 'return to map after club detail');
  await wait(`Boolean(document.querySelector('[aria-label="GameYer klub xəritəsi"]'))`, 'map restored after back navigation');
  assert((await evaluate(`document.querySelectorAll('.leaflet-marker-icon').length`)) > 0, 'Map markers did not restore after back navigation');

  await navigate('/');
  const resetVisible = await evaluate(`Boolean(Array.from(document.querySelectorAll('button')).find((b) => /Filtrləri təmizlə|Təmizlə/.test(b.textContent || '')))`);
  assert(!resetVisible, 'Clean homepage unexpectedly reports active filters');

  console.log('Discovery browser regression: PASS');
} finally {
  ws.close();
  chrome.kill('SIGTERM');
}
