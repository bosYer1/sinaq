import { spawn } from 'node:child_process';
import process from 'node:process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const CHROME_BIN = process.env.CHROME_BIN;
const PORT = Number(process.env.CLUB_RETURN_CDP_PORT || 9444);
if (!CHROME_BIN) throw new Error('CHROME_BIN is required');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message, context) => {
  if (!condition) throw new Error(`${message}\n${JSON.stringify(context ?? {}, null, 2)}`);
};

const chrome = spawn(CHROME_BIN, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/gameyer-club-return-chrome', 'about:blank',
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
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

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
const wait = async (expression, label, attempts = 100) => {
  for (let i = 0; i < attempts; i += 1) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}`);
};
const waitForPath = async (expectedPath, label, attempts = 100) => {
  for (let i = 0; i < attempts; i += 1) {
    if ((await evaluate('location.pathname')) === expectedPath) return;
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}`);
};
const navigate = async (path) => {
  await send('Page.navigate', { url: `${BASE_URL}${path}` });
  await wait(`document.readyState === 'complete'`, `navigate ${path}`);
  await sleep(500);
};
const visibleClubLinks = `Array.from(document.querySelectorAll('[data-explore-view="list"] a[href^="/klub/"]')).filter((a) => {
  const rect = a.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
})`;
const expandAndOpenLowerClub = async (originPath) => {
  await navigate(originPath);
  await wait(`Boolean(Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Daha çox klub göstər')))`, 'mobile expand button');
  await evaluate(`Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Daha çox klub göstər'))?.click()`);
  await wait(`Boolean(Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Daha az klub göstər')))`, 'expanded mobile list');
  await wait(`(${visibleClubLinks}).length > 8`, 'additional visible club cards after expand');
  const expanded = await evaluate(`(() => {
    const links = ${visibleClubLinks};
    const target = links[Math.min(12, links.length - 1)];
    target?.scrollIntoView({ block: 'center' });
    window.__gameyerTestClubHref = target?.getAttribute('href') || null;
    return { count: links.length, href: window.__gameyerTestClubHref };
  })()`);
  assert(expanded.count > 8 && expanded.href?.startsWith('/klub/'), 'Expanded list did not provide a lower visible club destination', expanded);
  await sleep(300);
  const savedScrollY = await evaluate(`document.querySelector('[data-mobile-scroll-root="true"]')?.scrollTop ?? 0`);
  const rootScrollY = await evaluate('window.scrollY');
  assert(savedScrollY > 0, 'Regression scenario failed to move below the top of the expanded list', { savedScrollY, rootScrollY });
  assert(Math.abs(rootScrollY) <= 1, 'Expanded mobile list must scroll inside the app shell, not the root document', { savedScrollY, rootScrollY });
  await evaluate(`(${visibleClubLinks}).find((a) => a.getAttribute('href') === window.__gameyerTestClubHref)?.click()`);
  await waitForPath(expanded.href, 'club detail navigation');
  return { expanded, savedScrollY };
};
const assertReturnedDiscovery = async (originPath, savedScrollY, label) => {
  await wait(`location.pathname === '/' && location.search === '?type=pc'`, `${label}: exact filtered discovery URL`);
  await wait(`Boolean(Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Daha az klub göstər')))`, `${label}: expanded state restored`);
  await wait(`(${visibleClubLinks}).length > 8`, `${label}: expanded visible club cards restored`);
  await sleep(500);
  const restored = await evaluate(`(() => {
    const root = document.querySelector('[data-mobile-scroll-root="true"]');
    return {
      path: location.pathname + location.search + location.hash,
      scrollY: root?.scrollTop ?? 0,
      rootScrollY: window.scrollY,
      clubLinks: (${visibleClubLinks}).length,
      scrollProbeBefore: root?.scrollTop ?? 0,
    };
  })()`);
  assert(restored.path === originPath, `${label}: search/filter query parameters were lost`, restored);
  assert(restored.clubLinks > 8, `${label}: returned visible list collapsed back to eight clubs`, restored);
  assert(Math.abs(restored.scrollY - savedScrollY) <= 180, `${label}: scroll position was not restored close enough`, { savedScrollY, ...restored });
  assert(Math.abs(restored.rootScrollY) <= 1, `${label}: return restoration leaked to root document scroll`, restored);
  const scrollProbe = await evaluate(`(() => {
    const root = document.querySelector('[data-mobile-scroll-root="true"]');
    if (!(root instanceof HTMLElement)) return { before: 0, after: 0, rootScrollY: window.scrollY };
    const before = root.scrollTop;
    root.scrollBy(0, 120);
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve({ before, after: root.scrollTop, rootScrollY: window.scrollY }))));
  })()`);
  assert(scrollProbe.after > scrollProbe.before, `${label}: inner page remained scroll-locked/frozen after return`, scrollProbe);
  assert(Math.abs(scrollProbe.rootScrollY) <= 1, `${label}: scroll probe escaped to root document`, scrollProbe);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Network.setBlockedURLs', { urls: ['*/api/analytics/visit*', '*posthog.com/*', '*posthog.com*', '*googletagmanager.com/*', '*google-analytics.com/*', '*connect.facebook.net/*', '*facebook.com/tr/*'] });
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

try {
  const originPath = '/?type=pc';

  const linkScenario = await expandAndOpenLowerClub(originPath);
  await wait(`Boolean(document.querySelector('a[data-back-to-clubs="true"]'))`, 'club return link');
  await evaluate(`document.querySelector('a[data-back-to-clubs="true"]')?.click()`);
  await assertReturnedDiscovery(originPath, linkScenario.savedScrollY, 'in-page return link');

  await evaluate(`Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Daha az klub göstər'))?.click()`);
  await wait(`(${visibleClubLinks}).length === 8`, 'collapse after in-page return');
  assert(await evaluate(`sessionStorage.getItem('gameyer:mobile-expanded-state') === null`), 'Collapse left stale expanded-list restoration state behind');

  const browserBackScenario = await expandAndOpenLowerClub(originPath);
  await evaluate('history.back()');
  await assertReturnedDiscovery(originPath, browserBackScenario.savedScrollY, 'browser Back');

  const firstHref = await evaluate(`(${visibleClubLinks})[0]?.getAttribute('href') || null`);
  assert(firstHref?.startsWith('/klub/'), 'Restored list no longer exposes clickable club cards', { firstHref });
  await evaluate(`(${visibleClubLinks})[0]?.click()`);
  await waitForPath(firstHref, 'club card remains interactive after browser Back restoration');

  console.log('Mobile club return browser regression: PASS (in-page link + browser Back + scroll probe)');
} finally {
  ws.close();
  chrome.kill('SIGTERM');
}
