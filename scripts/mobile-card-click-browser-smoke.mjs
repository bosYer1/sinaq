import { spawn } from 'node:child_process';
import process from 'node:process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const CHROME_BIN = process.env.CHROME_BIN;
const PORT = Number(process.env.MOBILE_CARD_ANALYTICS_CDP_PORT || 9451);
const CAPTURE_KEY = '__gameyer:mobile-card-click-captures';
const clubCardAnchors = `Array.from(document.querySelectorAll('[data-club-card-cta="true"]'))
  .map((cta) => cta.closest('a[href^="/klub/"]'))
  .filter(Boolean)`;

if (!CHROME_BIN) throw new Error('CHROME_BIN is required');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message, context) => {
  if (!condition) throw new Error(`${message}\n${JSON.stringify(context ?? {}, null, 2)}`);
};

const chrome = spawn(CHROME_BIN, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/gameyer-mobile-card-analytics',
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let chromeLog = '';
chrome.stdout.on('data', (chunk) => { chromeLog += chunk.toString(); });
chrome.stderr.on('data', (chunk) => { chromeLog += chunk.toString(); });

for (let attempt = 0; attempt < 60; attempt += 1) {
  try {
    if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break;
  } catch {}
  if (attempt === 59) throw new Error(`Chrome did not start\n${chromeLog}`);
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

const isExpectedNavigationTransitionError = (error) => error instanceof Error
  && /Inspected target navigated or closed|Execution context was destroyed|Cannot find context with specified id/i.test(error.message);

const wait = async (expression, label, attempts = 120) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      if (await evaluate(expression)) return;
    } catch (error) {
      if (!isExpectedNavigationTransitionError(error)) throw error;
    }
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}`);
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
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `(() => {
    const captureKey = ${JSON.stringify(CAPTURE_KEY)};
    const persistCapture = (event, properties, options) => {
      try {
        const previous = JSON.parse(sessionStorage.getItem(captureKey) || '[]');
        previous.push({
          event,
          properties: properties || null,
          options: options || null,
          pathname: location.pathname,
          viewportWidth: innerWidth,
        });
        sessionStorage.setItem(captureKey, JSON.stringify(previous));
      } catch {}
    };

    window.posthog = {
      __loaded: true,
      __SV: 1,
      init() {},
      capture: persistCapture,
      register_once() {},
      register_for_session() {},
      get_distinct_id() { return 'mobile-card-analytics-smoke'; },
      get_property() { return null; },
    };
  })();`,
});

try {
  await send('Page.navigate', { url: `${BASE_URL}/` });
  await wait(`document.readyState === 'complete'`, 'homepage load');
  await wait(`Boolean((${clubCardAnchors}).find((a) => {
    const rect = a.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }))`, 'visible ClubCard anchor');

  const home = await evaluate(`(() => {
    const card = (${clubCardAnchors}).find((a) => {
      const rect = a.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    return {
      viewportWidth: innerWidth,
      mobileMedia: matchMedia('(max-width: 1023px)').matches,
      href: card?.getAttribute('href') || null,
      hasClubCardMarker: Boolean(card?.querySelector('[data-club-card-cta="true"]')),
    };
  })()`);

  assert(home.viewportWidth === 390, 'Browser smoke did not run at the intended mobile viewport', home);
  assert(home.mobileMedia === true, 'ClubCard mobile hard-navigation media query is not active', home);
  assert(home.href?.startsWith('/klub/'), 'No visible ClubCard destination found', home);
  assert(home.hasClubCardMarker === true, 'Selected link is not a ClubCard anchor', home);

  const expectedSlug = decodeURIComponent(home.href.split('/').filter(Boolean).pop());
  const clicked = await evaluate(`(() => {
    const card = (${clubCardAnchors}).find((a) => a.getAttribute('href') === ${JSON.stringify(home.href)});
    if (!card) return false;
    setTimeout(() => card.click(), 50);
    return true;
  })()`);
  assert(clicked, 'Unable to schedule the mobile ClubCard click', home);

  await wait(`location.pathname === ${JSON.stringify(home.href)}`, 'mobile hard navigation to club detail');
  await wait(`document.readyState === 'complete'`, 'club detail load');

  const state = await evaluate(`(() => {
    let captures = [];
    try { captures = JSON.parse(sessionStorage.getItem(${JSON.stringify(CAPTURE_KEY)}) || '[]'); } catch {}
    const capture = captures.find((entry) => entry.event === 'club_card_click' && entry.properties?.club_slug === ${JSON.stringify(expectedSlug)});
    return {
      path: location.pathname,
      captures,
      matched: capture || null,
    };
  })()`);

  assert(state.path === home.href, 'Mobile ClubCard click did not complete a full detail navigation', state);
  assert(state.matched?.event === 'club_card_click', 'Mobile hard navigation did not call PostHog club_card_click before unload', state);
  assert(state.matched?.properties?.club_slug === expectedSlug, 'Captured club slug does not match the clicked ClubCard', state.matched);
  assert(state.matched?.properties?.gameyer_traffic_scope === 'test', 'Local browser smoke must retain test analytics scope', state.matched);
  assert(state.matched?.options?.send_instantly === true, 'Mobile club click must bypass the PostHog batch queue before unload', state.matched);
  assert(state.matched?.options?.transport === 'sendBeacon', 'Mobile club click must use unload-safe sendBeacon transport', state.matched);
  assert(state.matched?.viewportWidth === 390, 'Captured click did not originate from the mobile viewport', state.matched);

  console.log(JSON.stringify({
    status: 'PASS',
    href: home.href,
    clubSlug: expectedSlug,
    viewportWidth: state.matched.viewportWidth,
    sendInstantly: state.matched.options.send_instantly,
    transport: state.matched.options.transport,
  }, null, 2));
} finally {
  ws.close();
  chrome.kill('SIGTERM');
}
