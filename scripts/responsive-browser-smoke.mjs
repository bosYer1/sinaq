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
  const mobileNavOverlay = document.querySelector('[data-mobile-nav-overlay="true"]');
  return {
    scrollY: window.scrollY,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    visualViewportBottom: window.visualViewport
      ? window.visualViewport.offsetTop + window.visualViewport.height
      : window.innerHeight,
    visualViewportHeight: window.visualViewport?.height ?? window.innerHeight,
    viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '',
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientWidth: document.documentElement.clientWidth,
    header: rect(header),
    mobileNav: rect(mobileNav),
    mobileNavDisplay: mobileNav ? getComputedStyle(mobileNav).display : null,
    mobileNavOverlay: rect(mobileNavOverlay),
    mobileNavOverlayDisplay: mobileNavOverlay ? getComputedStyle(mobileNavOverlay).display : null,
  };
})()`;

function assert(condition, message, context) {
  if (!condition) throw new Error(`${message}\nContext: ${JSON.stringify(context, null, 2)}`);
}

async function assertCommonLayout(client, viewport, path) {
  const layout = await evaluate(client, commonLayoutExpression);
  assert(layout.scrollWidth <= layout.clientWidth + 1, `${viewport.name} ${path}: horizontal overflow detected`, layout);
  assert(/viewport-fit\s*=\s*cover/i.test(layout.viewportMeta), `${viewport.name} ${path}: viewport-fit=cover is missing from generated viewport metadata`, layout);
  assert(layout.header && layout.header.height >= 60 && layout.header.height <= 68, `${viewport.name} ${path}: header geometry is invalid`, layout);
  assert(layout.header.top >= -1 && layout.header.top <= 1, `${viewport.name} ${path}: sticky header is not pinned to viewport top`, layout);

  if (viewport.mobile) {
    assert(layout.mobileNavOverlayDisplay !== 'none', `${viewport.name} ${path}: mobile navigation overlay is hidden`, layout);
    assert(layout.mobileNavDisplay !== 'none', `${viewport.name} ${path}: mobile navigation is hidden`, layout);
    assert(layout.mobileNav && Math.abs(layout.mobileNav.bottom - layout.visualViewportBottom) <= 2, `${viewport.name} ${path}: mobile navigation is not pinned to the visual viewport bottom`, layout);

    const overlayContract = await evaluate(client, `(() => {
      const overlay = document.querySelector('[data-mobile-nav-overlay="true"]');
      const nav = document.querySelector('nav[aria-label="Mobil naviqasiya"]');
      if (!overlay || !nav) return null;
      const overlayStyle = getComputedStyle(overlay);
      const navStyle = getComputedStyle(nav);
      return {
        overlayPosition: overlayStyle.position,
        overlayTop: overlayStyle.top,
        overlayHeight: overlay.getBoundingClientRect().height,
        navPosition: navStyle.position,
        navBottom: navStyle.bottom,
        inlineNavTop: nav.style.top,
        inlineNavBottom: nav.style.bottom,
      };
    })()`);
    assert(overlayContract?.overlayPosition === 'fixed', `${viewport.name} ${path}: mobile navigation overlay must use fixed positioning`, overlayContract);
    assert(overlayContract?.overlayHeight != null && Math.abs(overlayContract.overlayHeight - layout.visualViewportHeight) <= 2, `${viewport.name} ${path}: dynamic viewport overlay height does not match the visible viewport`, { overlayContract, layout });
    assert(overlayContract?.navPosition === 'absolute', `${viewport.name} ${path}: nav must be absolute only inside the fixed overlay`, overlayContract);
    assert(overlayContract?.inlineNavTop === '' && overlayContract?.inlineNavBottom === '', `${viewport.name} ${path}: nav must not receive runtime inline positioning`, overlayContract);

    await evaluate(client, `window.scrollTo(0, Math.max(0, document.documentElement.scrollHeight - window.innerHeight))`);
    await sleep(120);
    const afterDown = await evaluate(client, commonLayoutExpression);
    assert(afterDown.mobileNav && Math.abs(afterDown.mobileNav.bottom - afterDown.visualViewportBottom) <= 2, `${viewport.name} ${path}: mobile navigation drifted from the visual viewport after scrolling down`, afterDown);

    await evaluate(client, `window.scrollTo(0, 0)`);
    await sleep(120);
    const afterUp = await evaluate(client, commonLayoutExpression);
    assert(afterUp.mobileNav && Math.abs(afterUp.mobileNav.bottom - afterUp.visualViewportBottom) <= 2, `${viewport.name} ${path}: mobile navigation drifted from the visual viewport after scrolling back up`, afterUp);
  } else {
    assert(layout.mobileNavOverlayDisplay === 'none', `${viewport.name} ${path}: mobile navigation overlay leaked into desktop layout`, layout);
    assert(layout.mobileNavOverlay?.width === 0 && layout.mobileNavOverlay?.height === 0, `${viewport.name} ${path}: hidden mobile overlay still occupies desktop geometry`, layout);
  }
}

async function assertHomepage(client, viewport) {
  await navigate(client, '/');
  if (viewport.mobile) {
    await waitForPage(client, '[aria-label="Xəritəni aktiv et"]');
    await waitForPage(client, '[data-map-preview="current-clubs"]');
    await sleep(500);
    const listView = await evaluate(client, `(() => {
      const activation = document.querySelector('[aria-label="Xəritəni aktiv et"]');
      const preview = document.querySelector('[data-map-preview="current-clubs"]');
      const map = document.querySelector('[aria-label="GameYer klub xəritəsi"]');
      const mapContainer = document.querySelector('[data-mobile-list-map-container="true"]');
      const mobileNav = document.querySelector('nav[aria-label="Mobil naviqasiya"]');
      const rect = mapContainer?.getBoundingClientRect();
      const navRect = mobileNav?.getBoundingClientRect();
      const updateCards = Array.from(document.querySelectorAll('[data-update-impression-id]')).filter((element) => element.getBoundingClientRect().height > 0);
      const firstUpdateTop = updateCards[0]?.getBoundingClientRect().top ?? null;
      return {
        liveMapLoaded: Boolean(map),
        liveMarkerCount: document.querySelectorAll('.leaflet-marker-icon').length,
        liveTileCount: document.querySelectorAll('.leaflet-tile').length,
        liveAttribution: Boolean(document.querySelector('.leaflet-control-attribution')),
        previewLoaded: Boolean(preview),
        previewMarkerCount: document.querySelectorAll('[data-map-preview-marker="true"]').length,
        previewTileCount: preview?.querySelectorAll('.gameyer-map-preview-tiles img').length ?? 0,
        previewAttribution: Boolean(preview?.querySelector('.gameyer-map-preview-attribution')),
        previewZoom: preview?.getAttribute('data-map-preview-zoom') ?? null,
        mapContainerRect: rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null,
        activationVisible: Boolean(activation),
        activationText: activation?.textContent?.trim() ?? null,
        mapActive: document.querySelector('[data-explore-view="list"]')?.getAttribute('data-mobile-map-active'),
        clubsVisible: document.body.innerText.includes('Klublar ('),
        mapContainerHeight: rect?.height ?? 0,
        updateCardCount: updateCards.length,
        firstUpdateTop,
        mobileNavTop: navRect?.top ?? null,
        clubResultsTop: document.getElementById('club-results')?.getBoundingClientRect().top ?? null,
      };
    })()`);
    assert(!listView.liveMapLoaded, `${viewport.name}: live Leaflet map loaded before mobile activation`, listView);
    assert(listView.liveMarkerCount === 0, `${viewport.name}: live Leaflet markers loaded before mobile activation`, listView);
    assert(listView.liveTileCount === 0, `${viewport.name}: live Leaflet tiles loaded before mobile activation`, listView);
    assert(!listView.liveAttribution, `${viewport.name}: live Leaflet attribution loaded before mobile activation`, listView);
    assert(listView.previewLoaded, `${viewport.name}: current-data map preview is missing before activation`, listView);
    assert(listView.previewMarkerCount > 0, `${viewport.name}: real preview markers are missing before activation`, listView);
    assert(listView.previewTileCount > 0, `${viewport.name}: preview OSM tiles are missing`, listView);
    assert(Number.isFinite(Number(listView.previewZoom)), `${viewport.name}: preview shared viewport zoom is missing`, listView);
    assert(listView.previewAttribution, `${viewport.name}: preview OpenStreetMap attribution is missing`, listView);
    assert(listView.activationVisible, `${viewport.name}: map activation control is missing`, listView);
    assert(listView.activationText === 'Xəritəyə toxunun', `${viewport.name}: visible map activation hint regressed`, listView);
    assert(listView.mapActive === 'false', `${viewport.name}: list map is interactive before activation`, listView);
    assert(listView.clubsVisible, `${viewport.name}: club list heading is missing`, listView);
    assert(listView.mapContainerHeight >= 335 && listView.mapContainerHeight <= 410, `${viewport.name}: enlarged list-view map height regressed`, listView);
    assert(listView.updateCardCount > 0, `${viewport.name}: mobile offer cards are missing from the homepage`, listView);
    assert(listView.firstUpdateTop != null && listView.mapContainerRect?.top != null && listView.firstUpdateTop < listView.mapContainerRect.top, `${viewport.name}: mobile offers must remain above club discovery`, listView);
    await capture(client, `${viewport.name}-home-list`);
    await evaluate(client, `document.querySelector('[aria-label="Xəritəni aktiv et"]')?.click()`);
    await waitForPage(client, '[aria-label="GameYer klub xəritəsi"]');
    for (let i = 0; i < 80; i += 1) {
      const ready = await evaluate(client, `document.querySelectorAll('.leaflet-marker-icon').length > 0 && document.querySelectorAll('.leaflet-tile').length > 0`);
      if (ready) break;
      if (i === 79) throw new Error(`${viewport.name}: live map assets did not load after activation`);
      await sleep(100);
    }
    const activated = await evaluate(client, `(() => {
      const map = document.querySelector('[aria-label="GameYer klub xəritəsi"]');
      const mapContainer = document.querySelector('[data-mobile-list-map-container="true"]');
      const rect = mapContainer?.getBoundingClientRect();
      return {
        activationVisible: Boolean(document.querySelector('[aria-label="Xəritəni aktiv et"]')),
        previewVisible: Boolean(document.querySelector('[data-map-preview="current-clubs"]')),
        mapLoaded: Boolean(map),
        markerCount: document.querySelectorAll('.leaflet-marker-icon').length,
        tileCount: document.querySelectorAll('.leaflet-tile').length,
        hasLeafletAttribution: Boolean(document.querySelector('.leaflet-control-attribution')),
        mapActive: document.querySelector('[data-explore-view="list"]')?.getAttribute('data-mobile-map-active'),
        mapContainerRect: rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null,
      };
    })()`);
    assert(!activated.activationVisible, `${viewport.name}: map activation control remained after touch`, activated);
    assert(!activated.previewVisible, `${viewport.name}: preview remained mounted after live-map activation`, activated);
    assert(activated.mapLoaded && activated.markerCount > 0 && activated.tileCount > 0, `${viewport.name}: live Leaflet map did not fully load after activation`, activated);
    assert(activated.hasLeafletAttribution, `${viewport.name}: live OpenStreetMap attribution is missing after activation`, activated);
    assert(activated.mapActive === 'true', `${viewport.name}: mobile list map state did not activate after touch`, activated);
    assert(listView.mapContainerRect && activated.mapContainerRect, `${viewport.name}: preview/live map container geometry is unavailable`, { listView, activated });
    assert(Math.abs(listView.mapContainerRect.width - activated.mapContainerRect.width) <= 1, `${viewport.name}: map container width changed on activation`, { listView, activated });
    assert(Math.abs(listView.mapContainerRect.height - activated.mapContainerRect.height) <= 1, `${viewport.name}: map container height changed on activation`, { listView, activated });
    assert(Math.abs(listView.mapContainerRect.left - activated.mapContainerRect.left) <= 1, `${viewport.name}: map container horizontal geometry changed on activation`, { listView, activated });
    assert(Math.abs(listView.mapContainerRect.top - activated.mapContainerRect.top) <= 1, `${viewport.name}: map container vertical geometry changed on activation`, { listView, activated });
    await evaluate(client, `Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Xəritə')?.click()`);
  }
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
    assert(initial.map.height >= 330 && initial.map.height <= 440, `${viewport.name}: mobile map height regressed`, initial);
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

async function assertIOSChromeNavFallback(client) {
  await client.send('Network.enable');
  await client.send('Network.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
  });
  await setViewport(client, 390, 844, true);
  await navigate(client, '/');
  await waitForPage(client, '[data-mobile-nav-overlay="true"]');
  await waitForPage(client, 'nav[aria-label="Mobil naviqasiya"]');
  await sleep(250);

  const initial = await evaluate(client, `(() => {
    const overlay = document.querySelector('[data-mobile-nav-overlay="true"]');
    const nav = document.querySelector('nav[aria-label="Mobil naviqasiya"]');
    const vv = window.visualViewport;
    const overlayRect = overlay?.getBoundingClientRect();
    const navRect = nav?.getBoundingClientRect();
    const overlayStyle = overlay ? getComputedStyle(overlay) : null;
    const navStyle = nav ? getComputedStyle(nav) : null;
    return {
      overlayPosition: overlayStyle?.position ?? null,
      overlayTop: overlayRect?.top ?? null,
      overlayHeight: overlayRect?.height ?? null,
      navPosition: navStyle?.position ?? null,
      navBottom: navRect?.bottom ?? null,
      visualBottom: vv ? vv.offsetTop + vv.height : null,
      visualHeight: vv?.height ?? null,
      scrollHeight: document.documentElement.scrollHeight,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '',
      sentinelPresent: Boolean(document.querySelector('[data-mobile-content-end="true"]')),
    };
  })()`);

  assert(initial.overlayPosition === 'fixed', 'iOS mobile nav must use a fixed viewport overlay', initial);
  assert(initial.navPosition === 'absolute', 'iOS nav must only be absolute inside the fixed overlay', initial);
  assert(initial.overlayTop != null && Math.abs(initial.overlayTop) <= 1, 'iOS nav overlay must stay pinned to viewport top', initial);
  assert(initial.overlayHeight != null && initial.visualHeight != null && Math.abs(initial.overlayHeight - initial.visualHeight) <= 2, 'iOS nav overlay must match dynamic viewport height', initial);
  assert(initial.navBottom != null && initial.visualBottom != null && Math.abs(initial.navBottom - initial.visualBottom) <= 2, 'iOS nav must align to visual viewport bottom', initial);
  assert(/viewport-fit\s*=\s*cover/i.test(initial.viewportMeta), 'iOS viewport must remain edge-to-edge', initial);
  assert(!initial.sentinelPresent, 'obsolete phantom-scroll sentinel must not remain in the document', initial);

  const overlayScrollImpact = await evaluate(client, `(() => {
    const overlay = document.querySelector('[data-mobile-nav-overlay="true"]');
    if (!(overlay instanceof HTMLElement)) return null;
    const before = document.documentElement.scrollHeight;
    const previousDisplay = overlay.style.display;
    overlay.style.display = 'none';
    const withoutOverlay = document.documentElement.scrollHeight;
    overlay.style.display = previousDisplay;
    const restored = document.documentElement.scrollHeight;
    return { before, withoutOverlay, restored };
  })()`);
  assert(overlayScrollImpact != null, 'iOS overlay scroll-impact probe could not run');
  assert(Math.abs(overlayScrollImpact.before - overlayScrollImpact.withoutOverlay) <= 1, 'mobile nav overlay must not contribute to document scroll height', overlayScrollImpact);
  assert(Math.abs(overlayScrollImpact.before - overlayScrollImpact.restored) <= 1, 'restoring nav overlay must not change document scroll height', overlayScrollImpact);

  const initialScrollHeight = initial.scrollHeight;
  for (const fraction of [0.35, 0.7, 1]) {
    await evaluate(client, `window.scrollTo(0, Math.max(0, (document.documentElement.scrollHeight - window.innerHeight) * ${fraction}))`);
    await sleep(180);
    const scrolled = await evaluate(client, `(() => {
      const nav = document.querySelector('nav[aria-label="Mobil naviqasiya"]');
      const overlay = document.querySelector('[data-mobile-nav-overlay="true"]');
      const vv = window.visualViewport;
      const navRect = nav?.getBoundingClientRect();
      const overlayRect = overlay?.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        navBottom: navRect?.bottom ?? null,
        visualBottom: vv ? vv.offsetTop + vv.height : null,
        overlayTop: overlayRect?.top ?? null,
      };
    })()`);
    assert(Math.abs(scrolled.scrollHeight - initialScrollHeight) <= 1, 'scrolling must not grow document height through mobile nav positioning', { initialScrollHeight, scrolled, fraction });
    assert(scrolled.navBottom != null && scrolled.visualBottom != null && Math.abs(scrolled.navBottom - scrolled.visualBottom) <= 2, 'iOS nav drifted during scroll', { scrolled, fraction });
    assert(scrolled.overlayTop != null && Math.abs(scrolled.overlayTop) <= 1, 'iOS overlay drifted from viewport top during scroll', { scrolled, fraction });
  }

  await evaluate(client, `window.scrollTo(0, 0)`);
  await sleep(120);
  const focused = await evaluate(client, `(() => {
    const field = document.querySelector('input[aria-label="Klub axtar"]');
    if (!(field instanceof HTMLInputElement)) return null;
    field.focus();
    const nav = document.querySelector('nav[aria-label="Mobil naviqasiya"]');
    const vv = window.visualViewport;
    const rect = nav?.getBoundingClientRect();
    return {
      active: document.activeElement === field,
      visibility: nav ? getComputedStyle(nav).visibility : null,
      navBottom: rect?.bottom ?? null,
      visualBottom: vv ? vv.offsetTop + vv.height : null,
    };
  })()`);
  assert(focused?.active, 'iOS keyboard regression requires a focusable search input', focused);
  assert(focused?.visibility === 'visible', 'CSS viewport overlay must not hide the nav during focus lifecycle', focused);

  await evaluate(client, `document.querySelector('input[aria-label="Klub axtar"]')?.blur()`);
  await navigate(client, '/rayon');
  await waitForPage(client, 'nav[aria-label="Mobil naviqasiya"]');
  await sleep(200);
  const afterRoute = await evaluate(client, `(() => {
    const overlay = document.querySelector('[data-mobile-nav-overlay="true"]');
    const nav = document.querySelector('nav[aria-label="Mobil naviqasiya"]');
    const vv = window.visualViewport;
    const overlayRect = overlay?.getBoundingClientRect();
    const navRect = nav?.getBoundingClientRect();
    return {
      overlayPosition: overlay ? getComputedStyle(overlay).position : null,
      navPosition: nav ? getComputedStyle(nav).position : null,
      overlayTop: overlayRect?.top ?? null,
      navBottom: navRect?.bottom ?? null,
      visualBottom: vv ? vv.offsetTop + vv.height : null,
    };
  })()`);
  assert(afterRoute.overlayPosition === 'fixed' && afterRoute.navPosition === 'absolute', 'route changes must preserve overlay architecture', afterRoute);
  assert(afterRoute.overlayTop != null && Math.abs(afterRoute.overlayTop) <= 1, 'route changes must keep overlay pinned to top', afterRoute);
  assert(afterRoute.navBottom != null && afterRoute.visualBottom != null && Math.abs(afterRoute.navBottom - afterRoute.visualBottom) <= 2, 'route changes must keep nav aligned to visible bottom', afterRoute);

  console.log('iOS Chrome dynamic-viewport overlay regression passed: stable bottom nav with no scroll-height feedback.');
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

  await assertIOSChromeNavFallback(client);

  console.log(`Responsive browser regression passed across ${viewports.length} viewports and ${criticalPaths.length + 1} critical routes per viewport.`);
} finally {
  client.close();
  chrome.kill('SIGTERM');
}