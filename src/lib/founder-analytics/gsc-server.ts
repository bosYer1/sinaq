import 'server-only';

import { createSign } from 'node:crypto';
import { unstable_cache } from 'next/cache';
import { metric } from './calculations';
import { providerStatus } from './providers';
import type { DateRange, GscMetrics, GscSearchRow } from './types';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const GSC_API_ROOT = 'https://searchconsole.googleapis.com/webmasters/v3';
const REQUEST_TIMEOUT_MS = 15_000;

type GscApiRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type GscApiResponse = { rows?: GscApiRow[] };

function encodeBase64Url(value: string | Buffer) { return Buffer.from(value).toString('base64url'); }
function normalizePrivateKey(value: string) { return value.replace(/\\n/g, '\n').trim(); }

function createServiceAccountAssertion(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = encodeBase64Url(JSON.stringify({ iss: clientEmail, scope: GSC_SCOPE, aud: GOOGLE_TOKEN_URL, iat: now, exp: now + 3600 }));
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
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
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

async function querySearchAnalytics(siteUrl: string, accessToken: string, from: string, to: string, dimensions: string[] = [], rowLimit = 25): Promise<GscApiResponse> {
  const response = await fetchWithTimeout(`${GSC_API_ROOT}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ startDate: bakuDate(from), endDate: bakuDate(to, true), dimensions, rowLimit, dataState: 'final' }),
  });
  if (!response.ok) throw new Error(`GSC Search Analytics request failed (${response.status})`);
  return response.json() as Promise<GscApiResponse>;
}

function totalFrom(body: GscApiResponse) {
  const row = body.rows?.[0];
  return {
    clicks: row?.clicks ?? 0,
    impressions: row?.impressions ?? 0,
    ctr: Math.round((row?.ctr ?? 0) * 10_000) / 100,
    position: Math.round((row?.position ?? 0) * 100) / 100,
  };
}

function rowsFrom(body: GscApiResponse): GscSearchRow[] {
  return (body.rows ?? []).map((row) => ({
    key: row.keys?.[0] ?? '(unknown)',
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: Math.round((row.ctr ?? 0) * 10_000) / 100,
    position: Math.round((row.position ?? 0) * 100) / 100,
  }));
}

function unavailableGsc(detail: string): GscMetrics {
  return {
    status: providerStatus('gsc', 'unavailable', detail),
    clicks: metric(0, 0),
    impressions: metric(0, 0),
    ctr: metric(0, 0),
    averagePosition: metric(0, 0),
    topQueries: [],
    topPages: [],
  };
}

async function loadGscMetrics(range: DateRange): Promise<GscMetrics> {
  const siteUrl = process.env.GSC_SITE_URL?.trim();
  const clientEmail = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY?.trim();
  const missing = [['GSC_SITE_URL', siteUrl], ['GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL', clientEmail], ['GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY', privateKey]]
    .filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) return unavailableGsc(`Konfiqurasiya yoxdur: ${missing.join(', ')}`);

  try {
    const accessToken = await getAccessToken(clientEmail!, privateKey!);
    const [currentBody, previousBody, queryBody, pageBody] = await Promise.all([
      querySearchAnalytics(siteUrl!, accessToken, range.from, range.to),
      querySearchAnalytics(siteUrl!, accessToken, range.previousFrom, range.previousTo),
      querySearchAnalytics(siteUrl!, accessToken, range.from, range.to, ['query'], 10),
      querySearchAnalytics(siteUrl!, accessToken, range.from, range.to, ['page'], 10),
    ]);
    const current = totalFrom(currentBody);
    const previous = totalFrom(previousBody);
    return {
      status: providerStatus('gsc', 'ready', `GSC read-only · ${Math.round(current.clicks)} klik · ${Math.round(current.impressions)} impression · CTR ${current.ctr}%`),
      clicks: metric(current.clicks, previous.clicks),
      impressions: metric(current.impressions, previous.impressions),
      ctr: metric(current.ctr, previous.ctr),
      averagePosition: metric(current.position, previous.position),
      topQueries: rowsFrom(queryBody),
      topPages: rowsFrom(pageBody),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'GSC Search Analytics sorğusu uğursuz oldu';
    return { ...unavailableGsc(detail), status: providerStatus('gsc', 'error', detail) };
  }
}

const cachedGscMetrics = unstable_cache(
  async (serializedRange: string) => loadGscMetrics(JSON.parse(serializedRange) as DateRange),
  ['founder-analytics-gsc-v1'],
  { revalidate: 300 },
);

export async function getGscMetrics(range: DateRange) { return cachedGscMetrics(JSON.stringify(range)); }
