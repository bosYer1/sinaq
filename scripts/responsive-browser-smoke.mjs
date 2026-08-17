import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const CHROME_BIN = process.env.CHROME_BIN;
const CDP_PORT = Number(process.env.CDP_PORT || 9222);
const ARTIFACT_DIR = process.env.RESPONSIVE_ARTIFACT_DIR || '/tmp/gameyer-responsive';

if (!CHROME_BIN) throw new Error('CHROME_BIN is required');
await mkdir(ARTIFACT_DIR, { recursive: true });

const chrome = spawn(CHROME_BIN, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  `--remote-debugging-port=${CDP_PORT}`,
  '--user-data-dir=/tmp/gameyer-responsive-chrome',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let chromeLog = '';
chrome.stdout.on('data', (chunk) => { chromeLog += chunk.toString(); });
chrome.stderr.on('data', (chunk) => { chromeLog += chunk.toString(); });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function createClient() {
  const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Unable to create Chrome target: ${response.status}`);
  const target = await response.json();
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  return client;
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) throw new Error(`Browser evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
  return result.result?.value;
}

async function waitForPage(client, selector = 'body') {
  for (let i = 0; i < 80; i += 1) {
    const ready = await evaluate(client, `document.readyState === 'complete' && Boolean(document.querySelector(${JSON.stringify(selector)}))`);
    if (ready) {
      await sleep(350);
      return;
    }
    await sleep(100);
  }
  throw new Error(`Page did not become ready for selector ${selector}`);
}

async function navigate(client, path) {
  await client.send('Page.navigate', { url: `${BASE_URL}${path}` });
  await waitForPage(client);
}

async function setViewport(client, width, height, mobile) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
  await client.send(
    'Emulation.setTouchEmulationEnabled',
    mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false },
  );
}

async function capture(client, name) {
  const result = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`${ARTIFACT_DIR}/${name}.png`, Buffer.from(result.data, 'base64'));
}

const commonLayoutExpression = `(() => {
  const rect = (element) => element ? {
    top: element.getBoundingClientRect().top,
    right: element.getBoundingClientRect().right,
    bottom: element.getBoundingClientRect().bottom,
    left: element.getBoundingClientRect().left,
    width: element.getBoundingClientRect().width,
    height: element.getBoundingClientRect().height,
  } : null;
  const header = document.querySelector('header');
  const mobileNav = document.querySelector('nav[aria-label="Mobil naviqasiya"]');
  return {
    scrollY: window.scrollY,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    header: rect(header),
    mobileNav: rect(mobileNav),
    mobileNavDisplay: mobileNav ? getComputedStyle(mobileNav).display : null,
  };
})()`;

function assert(condition, message, context) {
  if (!condition) throw new Error(`${message}\nContext: ${JSON.stringify(context, null, 2)}`);
}

async function assertCommonLayout(client, viewport, path) {
  const layout = await evaluate(client, commonLayoutExpression);
  assert(layout.scrollWidth <= layout.clientWidth + 1, `${viewport.name} ${path}: horizontal overflow detected`, layout);
  assert(layout.header && layout.header.height >= 60 && layout.header.height <= 68, `${viewport.name} ${path}: header geometry is invalid`, layout);
  assert(layout.header.top >= -1 && layout.header.top <= 1, `${viewport.name} ${path}: sticky header is not pinned to viewport top`, layout);

  if (viewport.mobile) {
    assert(layout.mobileNavDisplay !== 'none', `${viewport.name} ${path}: mobile navigation is hidden`, layout);
    assert(layout.mobileNav && Math.abs(layout.mobileNav.bottom - layout.innerHeight) <= 2, `${viewport.name} ${path}: mobile navigation is not pinned to viewport bottom`, layout);
  } else {
    assert(layout.mobileNavDisplay === 'none', `${viewport.name} ${path}: mobile navigation leaked into desktop layout`, layout);
  }
}

async function assertHomepage(client, viewport) {
  await navigate(client, '/');
  await waitForPage(client, '[aria-label="GameYer klub xəritəsi"]');
  await sleep(900);

  const initial = await evaluate(client, `(() => {
    const map = document.querySelector('[aria-label="GameYer klub xəritəsi"]');
    const search = document.querySelector('#club-search');
    const r = (element) => element ? element.getBoundingClientRect().toJSON() : null;
    return {
      scrollY: window.scrollY,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      map: r(map),
      search: r(search),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  })()`);

  assert(initial.scrollY <= 1, `${viewport.name}: homepage does not open at the top`, initial);
  assert(initial.map, `${viewport.name}: map did not render`, initial);
  assert(initial.search, `${viewport.name}: mobile search anchor target is missing`, initial);
  assert(initial.scrollWidth <= initial.clientWidth + 1, `${viewport.name}: homepage horizontal overflow detected`, initial);

  if (viewport.mobile) {
    assert(initial.map.height >= 330 && initial.map.height <= 420, `${viewport.name}: mobile map height regressed`, initial);
    assert(initial.map.left >= 0 && initial.map.right <= initial.innerWidth + 1, `${viewport.name}: mobile map escapes viewport`, initial);
  } else {
    assert(initial.map.height >= 588 && initial.map.height <= 662, `${viewport.name}: desktop map height regressed`, initial);
    assert(initial.map.width >= (viewport.width >= 1400 ? 700 : 480), `${viewport.name}: desktop map became too narrow`, initial);
  }

  await capture(client, `${viewport.name}-home-top`);

  const scrolled = await evaluate(client, `(() => {
    const map = document.querySelector('[aria-label="GameYer klub xəritəsi"]');
    const absoluteTop = map.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.max(0, absoluteTop + 60));
    return true;
  })()`);
  if (!scrolled) throw new Error(`${viewport.name}: failed to scroll map under sticky chrome`);
  await sleep(250);

  const stacking = await evaluate(client, `(() => {
    const topElement = document.elementFromPoint(Math.floor(window.innerWidth / 2), 24);
    const bottomElement = document.elementFromPoint(Math.floor(window.innerWidth / 2), window.innerHeight - 16);
    return {
      scrollY: window.scrollY,
      topIsHeader: Boolean(topElement?.closest('header')),
      bottomIsMobileNav: Boolean(bottomElement?.closest('nav[aria-label="Mobil naviqasiya"]')),
      topTag: topElement?.tagName || null,
      topClass: topElement?.className || null,
      bottomTag: bottomElement?.tagName || null,
      bottomClass: bottomElement?.className || null,
    };
  })()`);

  assert(stacking.scrollY > 0, `${viewport.name}: stacking test did not scroll`, stacking);
  assert(stacking.topIsHeader, `${viewport.name}: Leaflet/map content covers the sticky header`, stacking);
  if (viewport.mobile) assert(stacking.bottomIsMobileNav, `${viewport.name}: map/content covers the mobile navigation`, stacking);
  await capture(client, `${viewport.name}-home-map-scrolled`);
}

async function runViewport(client, viewport, criticalPaths) {
  await setViewport(client, viewport.width, viewport.height, viewport.mobile);
  await assertHomepage(client, viewport);

  for (const path of criticalPaths) {
    await navigate(client, path);
    await assertCommonLayout(client, viewport, path);
  }
}

await waitForChrome();
const client = await createClient();

try {
  const sitemap = await (await fetch(`${BASE_URL}/sitemap.xml`)).text();
  const clubMatch = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((match) => new URL(match[1]).pathname)
    .find((path) => path.startsWith('/klub/'));
  if (!clubMatch) throw new Error('No club detail URL found in sitemap');

  const criticalPaths = [
    '/rayon',
    '/tip',
    '/bakida-pc-klublari',
    '/bakida-playstation-klublari',
    '/bakida-24-saat-gaming-klublari',
    '/elaqe',
    '/klub-sahibi',
    clubMatch,
  ];

  const viewports = [
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    { name: 'mobile-430x932', width: 430, height: 932, mobile: true },
    { name: 'desktop-1024x768', width: 1024, height: 768, mobile: false },
    { name: 'desktop-1440x900', width: 1440, height: 900, mobile: false },
  ];

  for (const viewport of viewports) {
    await runViewport(client, viewport, criticalPaths);
    console.log(`Responsive browser checks passed: ${viewport.name}`);
  }

  console.log(`Responsive browser regression passed across ${viewports.length} viewports and ${criticalPaths.length + 1} critical routes per viewport.`);
} finally {
  client.close();
  chrome.kill('SIGTERM');
}
