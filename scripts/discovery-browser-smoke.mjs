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

try {
  await navigate('/');
  await wait(`Boolean(document.querySelector('input[aria-label="Klub axtar"]'))`, 'search input');
  const initialCount = await evaluate(`document.body.innerText.match(/Klublar \\((\\d+)\\)/)?.[1] || null`);
  assert(initialCount, 'Homepage club count missing');

  await evaluate(`(() => {
    const input = document.querySelector('input[aria-label="Klub axtar"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, '__definitely_no_real_club__');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await wait(`location.search.includes('q=__definitely_no_real_club__')`, 'search query URL update');
  await wait(`document.body.innerText.includes('Nəticə tapılmadı') || document.body.innerText.includes('klub tapılmadı') || document.body.innerText.includes('0 klub')`, 'search no-results state');

  await navigate('/?type=pc');
  const pcState = await evaluate(`(() => ({
    pressed: Array.from(document.querySelectorAll('button[aria-pressed="true"]')).map((b) => b.textContent?.trim()),
    noindex: document.querySelector('meta[name="robots"]')?.content || '',
    canonical: document.querySelector('link[rel="canonical"]')?.href || '',
  }))()`);
  assert(pcState.pressed.length > 0, 'Type filter did not activate', pcState);
  assert(pcState.noindex.toLowerCase().includes('noindex'), 'Filtered homepage must be noindex', pcState);
  assert(pcState.canonical === 'https://gameyer.az/' || pcState.canonical === `${BASE_URL}/`, 'Filtered homepage canonical regressed', pcState);

  await navigate('/?price_max=2');
  assert(await evaluate(`location.search.includes('price_max=2')`), 'Price filter query did not remain active');

  await navigate('/?view=map');
  await wait(`Boolean(document.querySelector('[aria-label="GameYer klub xəritəsi"]'))`, 'map view');
  const map = await evaluate(`(() => {
    const el = document.querySelector('[aria-label="GameYer klub xəritəsi"]');
    const rect = el?.getBoundingClientRect();
    return { exists: Boolean(el), width: rect?.width || 0, height: rect?.height || 0 };
  })()`);
  assert(map.exists && map.width > 250 && map.height > 300, 'Map view failed to render', map);

  await navigate('/');
  const resetVisible = await evaluate(`Boolean(Array.from(document.querySelectorAll('button')).find((b) => /Filtrləri təmizlə|Təmizlə/.test(b.textContent || '')))`);
  assert(!resetVisible, 'Clean homepage unexpectedly reports active filters');

  console.log('Discovery browser regression: PASS');
} finally {
  ws.close();
  chrome.kill('SIGTERM');
}
