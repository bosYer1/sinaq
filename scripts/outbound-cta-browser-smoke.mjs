import { spawn } from 'node:child_process';
import process from 'node:process';

const BASE_URL = (process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const CHROME_BIN = process.env.CHROME_BIN;
const PORT = Number(process.env.OUTBOUND_CTA_CDP_PORT || 9444);
if (!CHROME_BIN) throw new Error('CHROME_BIN is required');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message, context = undefined) => {
  if (!condition) {
    const suffix = context === undefined ? '' : `\n${JSON.stringify(context, null, 2)}`;
    throw new Error(`${message}${suffix}`);
  }
};

const chrome = spawn(CHROME_BIN, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/gameyer-outbound-cta-chrome',
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

const wait = async (expression, label) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
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
    '*/api/analytics/event*',
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
  await navigate('/');
  const clubHrefs = await evaluate(`Array.from(new Set(Array.from(document.querySelectorAll('a[href^="/klub/"]')).map((anchor) => anchor.getAttribute('href')).filter(Boolean)))`);
  assert(Array.isArray(clubHrefs) && clubHrefs.length > 0, 'No public club card is available for outbound CTA regression', { clubHrefs });

  let clubHref = null;
  let detail = null;
  for (const candidateHref of clubHrefs) {
    await navigate(candidateHref);
    await wait(`Boolean(document.querySelector('h1'))`, `club detail heading ${candidateHref}`);
    const candidateDetail = await evaluate(`(() => {
      const instagram = Array.from(document.querySelectorAll('a')).find((anchor) => (anchor.textContent || '').includes('Instagram profilinə bax'));
      const maps = Array.from(document.querySelectorAll('a')).find((anchor) => (anchor.textContent || '').includes('Google Maps-də marşrut'));
      const phone = document.querySelector('a[href^="tel:"]');
      return {
        path: location.pathname,
        instagramHref: instagram?.href || null,
        mapsHref: maps?.href || null,
        phoneHref: phone?.getAttribute('href') || null,
      };
    })()`);
    if (candidateDetail.instagramHref && candidateDetail.mapsHref && candidateDetail.phoneHref) {
      clubHref = candidateHref;
      detail = candidateDetail;
      break;
    }
  }

  assert(clubHref && detail, 'No public club detail exposes Phone, Instagram, and Maps CTAs for outbound analytics regression', { checkedClubHrefs: clubHrefs });
  assert(detail.path === clubHref, 'Outbound CTA regression did not land on the selected club detail page', detail);

  await evaluate(`(() => {
    const anchor = document.querySelector('a[href^="tel:"]');
    anchor.setAttribute('href', 'javascript:void(0)');
    anchor.click();
    return true;
  })()`);
  await wait(`window.__gameyerCapturedEvents.some((entry) => entry.event === 'phone_click')`, 'phone_click PostHog capture');

  const phoneCapture = await evaluate(`(() => {
    const capture = window.__gameyerCapturedEvents.find((entry) => entry.event === 'phone_click');
    return {
      path: location.pathname,
      event: capture?.event || null,
      properties: capture?.properties || null,
    };
  })()`);
  assert(phoneCapture.event === 'phone_click', 'Phone CTA did not emit phone_click', phoneCapture);
  assert(phoneCapture.properties?.club_slug === clubHref.split('/').filter(Boolean).pop(), 'Phone CTA lost club slug attribution', phoneCapture);
  assert(phoneCapture.properties?.cta_surface === 'contact_phone', 'Phone CTA lost contact surface attribution', phoneCapture);
  assert(phoneCapture.path === clubHref, 'Phone regression click unexpectedly navigated away from the club detail page', phoneCapture);

  await evaluate(`(() => {
    const anchor = Array.from(document.querySelectorAll('a')).find((item) => (item.textContent || '').includes('Instagram profilinə bax'));
    anchor.removeAttribute('target');
    anchor.setAttribute('href', 'javascript:void(0)');
    anchor.click();
    return true;
  })()`);
  await wait(`window.__gameyerCapturedEvents.some((entry) => entry.event === 'instagram_click')`, 'instagram_click PostHog capture');

  const instagramCapture = await evaluate(`(() => {
    const capture = window.__gameyerCapturedEvents.find((entry) => entry.event === 'instagram_click');
    return {
      path: location.pathname,
      event: capture?.event || null,
      properties: capture?.properties || null,
    };
  })()`);
  assert(instagramCapture.event === 'instagram_click', 'Instagram CTA did not emit instagram_click', instagramCapture);
  assert(instagramCapture.properties?.club_slug === clubHref.split('/').filter(Boolean).pop(), 'Instagram CTA lost club slug attribution', instagramCapture);
  assert(instagramCapture.properties?.cta_surface === 'contact_instagram', 'Instagram CTA lost contact surface attribution', instagramCapture);
  assert(instagramCapture.path === clubHref, 'Instagram regression click unexpectedly navigated away from the club detail page', instagramCapture);

  await evaluate(`(() => {
    const anchor = Array.from(document.querySelectorAll('a')).find((item) => (item.textContent || '').includes('Google Maps-də marşrut'));
    anchor.removeAttribute('target');
    anchor.setAttribute('href', 'javascript:void(0)');
    anchor.click();
    return true;
  })()`);
  await wait(`window.__gameyerCapturedEvents.some((entry) => entry.event === 'maps_click')`, 'maps_click PostHog capture');

  const mapsCapture = await evaluate(`(() => {
    const capture = window.__gameyerCapturedEvents.find((entry) => entry.event === 'maps_click');
    return {
      path: location.pathname,
      event: capture?.event || null,
      properties: capture?.properties || null,
    };
  })()`);
  assert(mapsCapture.event === 'maps_click', 'Maps CTA did not emit maps_click', mapsCapture);
  assert(mapsCapture.properties?.club_slug === clubHref.split('/').filter(Boolean).pop(), 'Maps CTA lost club slug attribution', mapsCapture);
  assert(mapsCapture.properties?.cta_surface === 'header_maps', 'Maps header CTA lost surface attribution', mapsCapture);
  assert(mapsCapture.path === clubHref, 'Maps regression click unexpectedly navigated away from the club detail page', mapsCapture);

  console.log('Outbound CTA browser regression: PASS');
} finally {
  ws.close();
  chrome.kill('SIGTERM');
}
