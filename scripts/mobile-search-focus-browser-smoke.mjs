import { spawn } from 'node:child_process';
import { mkdir, open } from 'node:fs/promises';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const CHROME_BIN = process.env.CHROME_BIN;
const CDP_PORT = Number(process.env.CDP_PORT || 9226);
const ARTIFACT_DIR = process.env.RESPONSIVE_ARTIFACT_DIR || '/tmp/gameyer-responsive';

if (!CHROME_BIN) throw new Error('CHROME_BIN is required');
await mkdir(ARTIFACT_DIR, { recursive: true });

const chrome = spawn(CHROME_BIN, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  `--remote-debugging-port=${CDP_PORT}`,
  '--user-data-dir=/tmp/gameyer-mobile-search-chrome',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let chromeLog = '';
chrome.stdout.on('data', (chunk) => { chromeLog += chunk.toString(); });
chrome.stderr.on('data', (chunk) => { chromeLog += chunk.toString(); });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws?.close();
  }
}

async function waitForChrome() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (response.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error(`Chrome DevTools endpoint did not start.\n${chromeLog}`);
}

async function createClient() {
  const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Unable to create Chrome target: ${response.status}`);
  const target = await response.json();
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
  });
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  return client;
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(`Browser evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
  return result.result?.value;
}

async function waitFor(client, expression, label) {
  for (let i = 0; i < 80; i += 1) {
    if (await evaluate(client, expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function navigate(client, path) {
  await client.send('Page.navigate', { url: `${BASE_URL}${path}` });
  await waitFor(client, `document.readyState === 'complete'`, `${path} load`);
  await sleep(350);
}

function assert(condition, message, context) {
  if (!condition) throw new Error(`${message}\nContext: ${JSON.stringify(context, null, 2)}`);
}

await waitForChrome();
const client = await createClient();

try {
  // Cross-page navigation must land on the homepage search field and focus it.
  await navigate(client, '/tip');
  await waitFor(client, `Boolean(document.querySelector('nav[aria-label="Mobil naviqasiya"] a[href="/#club-search"]'))`, 'mobile search nav link');
  await evaluate(client, `document.querySelector('nav[aria-label="Mobil naviqasiya"] a[href="/#club-search"]')?.click()`);
  await waitFor(client, `location.pathname === '/' && location.hash === '#club-search' && Boolean(document.querySelector('input[aria-label="Klub axtar"]'))`, 'homepage search hash navigation');
  await waitFor(client, `document.activeElement?.getAttribute('aria-label') === 'Klub axtar'`, 'search input focus after cross-page navigation');

  const firstFocus = await evaluate(client, `(() => {
    const input = document.querySelector('input[aria-label="Klub axtar"]');
    const search = document.getElementById('club-search');
    const rect = search?.getBoundingClientRect();
    return {
      hash: location.hash,
      inputFocused: document.activeElement === input,
      searchTop: rect?.top ?? null,
      searchBottom: rect?.bottom ?? null,
      viewportHeight: innerHeight,
    };
  })()`);
  assert(firstFocus.hash === '#club-search', 'Cross-page search navigation lost the canonical hash', firstFocus);
  assert(firstFocus.inputFocused, 'Cross-page mobile search navigation did not focus the input', firstFocus);
  assert(firstFocus.searchTop != null && firstFocus.searchBottom > 0 && firstFocus.searchTop < firstFocus.viewportHeight, 'Search controls are not visible after navigation', firstFocus);

  const mobileSearchTypography = await evaluate(client, `(() => {
    const input = document.querySelector('input[aria-label="Klub axtar"]');
    if (!(input instanceof HTMLInputElement)) return null;
    return { fontSize: Number.parseFloat(getComputedStyle(input).fontSize) };
  })()`);
  assert(mobileSearchTypography?.fontSize >= 16, 'Mobile search input must stay at least 16px to prevent iOS Safari focus zoom', mobileSearchTypography);

  // Repeated tapping while already on the same hash must still provide immediate focus feedback.
  await evaluate(client, `document.querySelector('input[aria-label="Klub axtar"]')?.blur()`);
  await waitFor(client, `document.activeElement?.getAttribute('aria-label') !== 'Klub axtar'`, 'search input blur');
  await evaluate(client, `document.querySelector('nav[aria-label="Mobil naviqasiya"] a[href="/#club-search"]')?.click()`);
  await waitFor(client, `document.activeElement?.getAttribute('aria-label') === 'Klub axtar'`, 'search input focus after repeated same-hash tap');

  const repeatedFocus = await evaluate(client, `({
    hash: location.hash,
    pathname: location.pathname,
    inputFocused: document.activeElement?.getAttribute('aria-label') === 'Klub axtar'
  })`);
  assert(repeatedFocus.pathname === '/' && repeatedFocus.hash === '#club-search', 'Repeated mobile search tap changed the destination unexpectedly', repeatedFocus);
  assert(repeatedFocus.inputFocused, 'Repeated same-hash mobile search tap did not refocus the input', repeatedFocus);

  const touchBehavior = await evaluate(client, `(() => {
    const input = document.querySelector('input[aria-label="Klub axtar"]');
    if (!(input instanceof HTMLInputElement)) return null;
    return {
      touchAction: getComputedStyle(input).touchAction,
      fontSize: Number.parseFloat(getComputedStyle(input).fontSize),
      scaleBefore: window.visualViewport?.scale ?? 1,
    };
  })()`);
  assert(touchBehavior?.fontSize >= 16, 'Mobile search input must stay at least 16px', touchBehavior);
  assert(touchBehavior?.touchAction === 'manipulation', 'Mobile search input must disable double-tap zoom gestures', touchBehavior);

  await evaluate(client, `(() => {
    const input = document.querySelector('input[aria-label="Klub axtar"]');
    if (!(input instanceof HTMLInputElement)) return;
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  })()`);
  await waitFor(client, `document.activeElement?.getAttribute('aria-label') !== 'Klub axtar'`, 'search input blur after Enter');
  const submitState = await evaluate(client, `({
    inputFocused: document.activeElement?.getAttribute('aria-label') === 'Klub axtar',
    scaleAfter: window.visualViewport?.scale ?? 1
  })`);
  assert(!submitState.inputFocused, 'Mobile Search/Enter must end input focus', submitState);

  const realClubName = await evaluate(client, `document.querySelector('a[href^="/klub/"] h3')?.textContent?.trim() || ''`);
  assert(realClubName.length > 0, 'A real club name is required for committed-result reveal regression', { realClubName });

  await evaluate(client, `(() => {
    const input = document.querySelector('input[aria-label="Klub axtar"]');
    if (!(input instanceof HTMLInputElement)) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, ${JSON.stringify(realClubName)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitFor(client, `new URLSearchParams(location.search).get('q') === ${JSON.stringify(realClubName)}`, 'committed search query before result reveal');
  await evaluate(client, `document.querySelector('input[aria-label="Klub axtar"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`);
  await waitFor(client, `(() => {
    const results = document.getElementById('club-results');
    if (!results) return false;
    const rect = results.getBoundingClientRect();
    return rect.top >= 0 && rect.top < innerHeight;
  })()`, 'search result block reveal after Enter');

  const resultRevealState = await evaluate(client, `(() => {
    const results = document.getElementById('club-results');
    const map = document.querySelector('[data-mobile-list-map-container="true"]');
    const resultCount = Number(document.querySelector('[data-explore-view]')?.getAttribute('data-result-count') || '-1');
    const resultsRect = results?.getBoundingClientRect();
    const mapRect = map?.getBoundingClientRect();
    return {
      heading: results?.textContent?.replace(/\\s+/g, ' ').trim() || '',
      resultCount,
      resultsTop: resultsRect?.top ?? null,
      viewportHeight: innerHeight,
      mapHeight: mapRect?.height ?? null,
    };
  })()`);
  assert(resultRevealState.heading.includes('Axtarış nəticələri'), 'Committed search must expose explicit result context', resultRevealState);
  assert(resultRevealState.resultCount > 0, 'Committed real-club search must expose a positive result count', resultRevealState);
  assert(resultRevealState.resultsTop != null && resultRevealState.resultsTop < resultRevealState.viewportHeight, 'Committed results must be visible after Search/Enter', resultRevealState);
  assert(resultRevealState.mapHeight != null && resultRevealState.mapHeight <= 280.5, 'Search mode map must stay compact before mobile results', resultRevealState);

  const screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const screenshotFile = await open(`${ARTIFACT_DIR}/mobile-search-focus.png`, 'wx', 0o600);
  try {
    await screenshotFile.writeFile(Buffer.from(screenshot.data, 'base64'));
  } finally {
    await screenshotFile.close();
  }

  console.log('Mobile search focus browser regression passed: focus, zoom guards, and committed result reveal are healthy.');
} finally {
  client.close();
  chrome.kill('SIGTERM');
}
