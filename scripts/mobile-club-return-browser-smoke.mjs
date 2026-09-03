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
const navigate = async (path) => {
  await send('Page.navigate', { url: `${BASE_URL}${path}` });
  await wait(`document.readyState === 'complete'`, `navigate ${path}`);
  await sleep(500);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

try {
  const originPath = '/?type=pc';
  await navigate(originPath);
  await wait(`Boolean(Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Daha çox klub göstər')))`, 'mobile expand button');

  const beforeExpand = await evaluate(`({
    path: location.pathname + location.search + location.hash,
    clubLinks: document.querySelectorAll('a[href^="/klub/"]').length,
  })`);
  assert(beforeExpand.path === originPath, 'Initial filtered discovery URL changed unexpectedly', beforeExpand);
  assert(beforeExpand.clubLinks === 4, 'Collapsed mobile list must initially expose exactly four club cards', beforeExpand);

  await evaluate(`Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Daha çox klub göstər'))?.click()`);
  await wait(`Boolean(Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Daha az klub göstər')))`, 'expanded mobile list');
  await wait(`document.querySelectorAll('a[href^="/klub/"]').length > 4`, 'additional club cards after expand');

  const expanded = await evaluate(`(() => {
    const links = Array.from(document.querySelectorAll('a[href^="/klub/"]'));
    const target = links[Math.min(8, links.length - 1)];
    target?.scrollIntoView({ block: 'center' });
    return { count: links.length, href: target?.getAttribute('href') || null };
  })()`);
  assert(expanded.count > 4 && expanded.href?.startsWith('/klub/'), 'Expanded list did not provide a lower club destination', expanded);
  await sleep(300);

  const savedScrollY = await evaluate('window.scrollY');
  assert(savedScrollY > 0, 'Regression scenario failed to move below the top of the expanded list', { savedScrollY });

  await evaluate(`Array.from(document.querySelectorAll('a[href^="/klub/"]')).find((a) => a.getAttribute('href') === ${JSON.stringify(expanded.href)})?.click()`);
  await wait(`location.pathname === ${JSON.stringify(expanded.href)}`, 'club detail navigation');
  await wait(`Boolean(Array.from(document.querySelectorAll('a')).find((a) => (a.textContent || '').includes('Klublara qayıt')))`, 'Klublara qayıt link');

  const detailState = await evaluate(`({
    path: location.pathname,
    originEntry: sessionStorage.getItem('gameyer:club-entry-origin'),
    expandedEntry: sessionStorage.getItem('gameyer:mobile-expanded-state'),
  })`);
  assert(detailState.path === expanded.href, 'Club card did not reach its detail page', detailState);
  assert(detailState.originEntry?.includes(originPath), 'Club detail did not retain the matching discovery origin', detailState);
  assert(detailState.expandedEntry?.includes(originPath), 'Expanded-list restoration state was not retained on detail page', detailState);

  await evaluate(`Array.from(document.querySelectorAll('a')).find((a) => (a.textContent || '').includes('Klublara qayıt'))?.click()`);
  await wait(`location.pathname === '/' && location.search === '?type=pc'`, 'clean return to exact filtered discovery URL');
  await wait(`Boolean(Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Daha az klub göstər')))`, 'expanded state restored after return');
  await wait(`document.querySelectorAll('a[href^="/klub/"]').length > 4`, 'expanded club cards restored after return');
  await sleep(500);

  const restored = await evaluate(`({
    path: location.pathname + location.search + location.hash,
    scrollY: window.scrollY,
    clubLinks: document.querySelectorAll('a[href^="/klub/"]').length,
    expandedState: sessionStorage.getItem('gameyer:mobile-expanded-state'),
  })`);
  assert(restored.path === originPath, 'Search/filter query parameters were lost on return', restored);
  assert(restored.clubLinks > 4, 'Returned list collapsed back to the first four clubs', restored);
  assert(Math.abs(restored.scrollY - savedScrollY) <= 180, 'Scroll position was not restored close enough to the pre-navigation position', { savedScrollY, ...restored });

  await evaluate(`Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Daha az klub göstər'))?.click()`);
  await wait(`Boolean(Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Daha çox klub göstər')))`, 'collapse after restored return');
  await wait(`document.querySelectorAll('a[href^="/klub/"]').length === 4`, 'four-card collapsed list after restored return');
  assert(await evaluate(`sessionStorage.getItem('gameyer:mobile-expanded-state') === null`), 'Collapse left stale expanded-list restoration state behind');

  const firstHref = await evaluate(`document.querySelector('a[href^="/klub/"]')?.getAttribute('href') || null`);
  assert(firstHref?.startsWith('/klub/'), 'Collapsed list no longer exposes clickable club cards', { firstHref });
  await evaluate(`document.querySelector('a[href^="/klub/"]')?.click()`);
  await wait(`location.pathname === ${JSON.stringify(firstHref)}`, 'club card remains interactive after restoration and collapse');

  console.log('Mobile club return browser regression: PASS');
} finally {
  ws.close();
  chrome.kill('SIGTERM');
}
