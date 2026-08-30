import { spawn } from 'node:child_process';
import process from 'node:process';

const BASE_URL = process.env.TEST_BASE_URL || 'https://gameyer.az';
const CHROME_BIN = process.env.CHROME_BIN || 'google-chrome-stable';
const PORT = Number(process.env.ANALYTICS_CDP_PORT || 9444);
const SMOKE_QUERY = '__analytics_smoke=1';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message, context) => { if (!condition) throw new Error(`${message}\n${JSON.stringify(context ?? {}, null, 2)}`); };

const chrome = spawn(CHROME_BIN, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/gameyer-analytics-smoke', 'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });
let chromeLog = '';
chrome.stdout.on('data', (chunk) => { chromeLog += chunk.toString(); });
chrome.stderr.on('data', (chunk) => { chromeLog += chunk.toString(); });

for (let attempt = 0; attempt < 60; attempt += 1) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  if (attempt === 59) throw new Error(`Chrome did not start\n${chromeLog}`);
  await sleep(250);
}

const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let id = 0;
const pending = new Map();
const requests = [];
ws.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data));
  if (message.method === 'Network.requestWillBeSent') requests.push(message.params?.request?.url || '');
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
const wait = async (expression, label, attempts = 100) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}`);
};
const navigate = async (path) => {
  const separator = path.includes('?') ? '&' : '?';
  await send('Page.navigate', { url: `${BASE_URL}${path}${separator}${SMOKE_QUERY}` });
  await wait(`document.readyState === 'complete'`, `navigate ${path}`);
  await sleep(1500);
};
const clickWithoutNavigation = async (selectorExpression) => evaluate(`(() => {
  const el = ${selectorExpression};
  if (!el) return false;
  const prevent = (event) => event.preventDefault();
  el.addEventListener('click', prevent, { capture: true, once: true });
  el.click();
  return true;
})()`);

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');

try {
  await navigate('/');
  await wait(`Boolean(window.posthog && typeof window.posthog.get_distinct_id === 'function')`, 'PostHog initialization');
  const home = await evaluate(`(() => ({
    host: location.host,
    path: location.pathname,
    smoke: new URLSearchParams(location.search).get('__analytics_smoke'),
    distinctId: window.posthog?.get_distinct_id?.() || null,
    clubHref: Array.from(document.querySelectorAll('a[href^="/klub/"]')).map((a) => a.getAttribute('href')).find(Boolean) || null,
  }))()`);
  assert(home.host === 'gameyer.az' || BASE_URL.includes('127.0.0.1'), 'Unexpected production host', home);
  assert(home.smoke === '1', 'Analytics smoke marker missing', home);
  assert(home.distinctId, 'PostHog distinct id missing', home);
  assert(home.clubHref, 'No club detail link found', home);

  const clubClicked = await clickWithoutNavigation(`Array.from(document.querySelectorAll('a[href^="/klub/"]')).find(Boolean)`);
  assert(clubClicked, 'Unable to exercise club card click');
  await sleep(750);

  await navigate(home.clubHref);
  const actionPresence = await evaluate(`(() => ({
    phone: Boolean(document.querySelector('a[href^="tel:"]')),
    instagram: Boolean(Array.from(document.querySelectorAll('a[href]')).find((a) => /instagram\\.com/i.test(a.href))),
    maps: Boolean(Array.from(document.querySelectorAll('a[href]')).find((a) => /google\\.[^/]+\\/maps|maps\\.app\\.goo\\.gl|maps\.google/i.test(a.href))),
  }))()`);
  if (actionPresence.phone) await clickWithoutNavigation(`document.querySelector('a[href^="tel:"]')`);
  if (actionPresence.instagram) await clickWithoutNavigation(`Array.from(document.querySelectorAll('a[href]')).find((a) => /instagram\\.com/i.test(a.href))`);
  if (actionPresence.maps) await clickWithoutNavigation(`Array.from(document.querySelectorAll('a[href]')).find((a) => /google\\.[^/]+\\/maps|maps\\.app\\.goo\\.gl|maps\.google/i.test(a.href))`);
  await sleep(2500);

  await navigate('/haqqimizda');
  await sleep(3500);

  const analyticsRequests = {
    posthog: requests.filter((url) => /posthog|us\.i\.posthog\.com/i.test(url)),
    ga4: requests.filter((url) => /google-analytics\.com|googletagmanager\.com/i.test(url)),
    meta: requests.filter((url) => /connect\.facebook\.net|facebook\.com\/tr/i.test(url)),
  };
  assert(analyticsRequests.posthog.length > 0, 'No PostHog network request observed', analyticsRequests);
  assert(analyticsRequests.ga4.length > 0, 'No GA4/GTM network request observed', analyticsRequests);
  assert(analyticsRequests.meta.length > 0, 'No Meta Pixel network request observed', analyticsRequests);

  console.log(JSON.stringify({
    status: 'PASS',
    baseUrl: BASE_URL,
    smokeDistinctId: home.distinctId,
    clubPath: home.clubHref,
    clubActionsPresent: actionPresence,
    network: {
      posthogRequests: analyticsRequests.posthog.length,
      ga4Requests: analyticsRequests.ga4.length,
      metaRequests: analyticsRequests.meta.length,
    },
  }, null, 2));
} finally {
  ws.close();
  chrome.kill('SIGTERM');
}
