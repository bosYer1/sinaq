import 'server-only';

import { createSign } from 'node:crypto';
import { unstable_cache } from 'next/cache';
import { metric } from './calculations';
import { providerStatus } from './providers';
import type { DateRange, Ga4Metrics } from './types';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GA4_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const GA4_API_ROOT = 'https://analyticsdata.googleapis.com/v1beta';
const REQUEST_TIMEOUT_MS = 15_000;

const METRICS = [
  'sessions', 'activeUsers', 'totalUsers', 'newUsers', 'screenPageViews',
  'engagementRate', 'bounceRate', 'averageSessionDuration', 'eventCount', 'keyEvents',
] as const;

type MetricName = typeof METRICS[number];
type Ga4Report = Record<MetricName, number>;
type Ga4ApiResponse = {
  metricHeaders?: Array<{ name?: string }>;
  rows?: Array<{ metricValues?: Array<{ value?: string }> }>;
};

function emptyReport(): Ga4Report {
  return { sessions: 0, activeUsers: 0, totalUsers: 0, newUsers: 0, screenPageViews: 0, engagementRate: 0, bounceRate: 0, averageSessionDuration: 0, eventCount: 0, keyEvents: 0 };
}

function encodeBase64Url(value: string | Buffer) { return Buffer.from(value).toString('base64url'); }
function normalizePrivateKey(value: string) { return value.replace(/\\n/g, '\n').trim(); }

function createServiceAccountAssertion(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = encodeBase64Url(JSON.stringify({ iss: clientEmail, scope: GA4_SCOPE, aud: GOOGLE_TOKEN_URL, iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${signer.sign(normalizePrivateKey(privateKey)).toString('base64url')}`;
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try { return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' }); }
  finally { clearTimeout(timer); }
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const response = await fetchWithTimeout(GOOGLE_TOKEN_URL, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: createServiceAccountAssertion(clientEmail, privateKey) }),
  });
  if (!response.ok) throw new Error(`Google OAuth token request failed (${response.status})`);
  const body = await response.json() as { access_token?: string };
  if (!body.access_token) throw new Error('Google OAuth token response did not include an access token');
  return body.access_token;
}

function bakuDate(iso: string, subtractMillisecond = false) {
  const value = new Date(new Date(iso).getTime() - (subtractMillisecond ? 1 : 0));
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
}

function parseReport(body: Ga4ApiResponse): Ga4Report {
  const result = emptyReport();
  const headers = body.metricHeaders ?? [];
  const values = body.rows?.[0]?.metricValues ?? [];
  headers.forEach((header, index) => {
    const name = header.name as MetricName | undefined;
    if (!name || !METRICS.includes(name)) return;
    const parsed = Number(values[index]?.value ?? 0);
    result[name] = Number.isFinite(parsed) ? parsed : 0;
  });
  return result;
}

async function runReport(propertyId: string, accessToken: string, from: string, to: string): Promise<Ga4Report> {
  if (!/^\d+$/.test(propertyId)) throw new Error('GA4 property configuration is invalid');
  const response = await fetchWithTimeout(`${GA4_API_ROOT}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ dateRanges: [{ startDate: bakuDate(from), endDate: bakuDate(to, true) }], metrics: METRICS.map((name) => ({ name })), keepEmptyRows: true }),
  });
  if (!response.ok) throw new Error(`GA4 Data API request failed (${response.status})`);
  return parseReport(await response.json() as Ga4ApiResponse);
}

function percent(value: number) { return Math.round(value * 10_000) / 100; }
function seconds(value: number) { return Math.round(value * 100) / 100; }

function unavailableGa4(detail: string): Ga4Metrics {
  return {
    status: providerStatus('ga4', 'unavailable', detail),
    sessions: metric(0, 0), activeUsers: metric(0, 0), totalUsers: metric(0, 0), newUsers: metric(0, 0),
    pageviews: metric(0, 0), engagementRate: metric(0, 0), bounceRate: metric(0, 0),
    averageSessionDuration: metric(0, 0), eventCount: metric(0, 0), keyEvents: metric(0, 0),
  };
}

async function loadGa4Metrics(range: DateRange): Promise<Ga4Metrics> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.trim();
  const missing = [['GA4_PROPERTY_ID', propertyId], ['GOOGLE_ANALYTICS_CLIENT_EMAIL', clientEmail], ['GOOGLE_ANALYTICS_PRIVATE_KEY', privateKey]]
    .filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) return unavailableGa4(`Konfiqurasiya yoxdur: ${missing.join(', ')}`);

  try {
    const accessToken = await getAccessToken(clientEmail!, privateKey!);
    const [current, previous] = await Promise.all([
      runReport(propertyId!, accessToken, range.from, range.to),
      runReport(propertyId!, accessToken, range.previousFrom, range.previousTo),
    ]);
    return {
      status: providerStatus('ga4', 'ready', `GA4 read-only · ${Math.round(current.sessions)} sessiya · ${Math.round(current.activeUsers)} aktiv user · ${Math.round(current.screenPageViews)} pageview`),
      sessions: metric(current.sessions, previous.sessions), activeUsers: metric(current.activeUsers, previous.activeUsers),
      totalUsers: metric(current.totalUsers, previous.totalUsers), newUsers: metric(current.newUsers, previous.newUsers),
      pageviews: metric(current.screenPageViews, previous.screenPageViews),
      engagementRate: metric(percent(current.engagementRate), percent(previous.engagementRate)),
      bounceRate: metric(percent(current.bounceRate), percent(previous.bounceRate)),
      averageSessionDuration: metric(seconds(current.averageSessionDuration), seconds(previous.averageSessionDuration)),
      eventCount: metric(current.eventCount, previous.eventCount), keyEvents: metric(current.keyEvents, previous.keyEvents),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'GA4 Data API sorğusu uğursuz oldu';
    return { ...unavailableGa4(detail), status: providerStatus('ga4', 'error', detail) };
  }
}

const cachedGa4Metrics = unstable_cache(
  async (serializedRange: string) => loadGa4Metrics(JSON.parse(serializedRange) as DateRange),
  ['founder-analytics-ga4-v1'], { revalidate: 300 },
);

export async function getGa4Metrics(range: DateRange) { return cachedGa4Metrics(JSON.stringify(range)); }
