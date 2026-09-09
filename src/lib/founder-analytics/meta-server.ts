import 'server-only';

import { unstable_cache } from 'next/cache';
import { metric } from './calculations';
import { providerStatus } from './providers';
import type { DateRange, MetaAdsMetrics, MetaCampaignRow } from './types';

const META_API_VERSION = 'v26.0';
const META_API_ROOT = `https://graph.facebook.com/${META_API_VERSION}`;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_CAMPAIGN_PAGES = 10;
const PAGE_LIMIT = 500;

const ACCOUNT_FIELDS = [
  'account_currency',
  'spend',
  'impressions',
  'reach',
  'clicks',
  'ctr',
  'cpc',
  'cpm',
] as const;

const CAMPAIGN_FIELDS = [
  'campaign_id',
  'campaign_name',
  'spend',
  'impressions',
  'reach',
  'clicks',
  'ctr',
  'cpc',
  'cpm',
] as const;

type MetaInsightRow = {
  account_currency?: string;
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
};

type MetaInsightsResponse = {
  data?: MetaInsightRow[];
  paging?: { cursors?: { after?: string } };
};

type MetaAggregate = {
  currency: string | null;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
};

function numberValue(value: string | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function normalizeAccountId(value: string) {
  const accountId = value.trim().replace(/^act_/i, '');
  if (!/^\d+$/.test(accountId)) throw new Error('Meta ad account configuration is invalid');
  return accountId;
}

function bakuDate(iso: string, subtractMillisecond = false) {
  const value = new Date(new Date(iso).getTime() - (subtractMillisecond ? 1 : 0));
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baku',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function metaTimeRange(from: string, to: string) {
  return JSON.stringify({ since: bakuDate(from), until: bakuDate(to, true) });
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

async function requestInsights(
  accountId: string,
  accessToken: string,
  fields: readonly string[],
  from: string,
  to: string,
  level: 'account' | 'campaign',
): Promise<MetaInsightRow[]> {
  const rows: MetaInsightRow[] = [];
  let after: string | undefined;
  const maxPages = level === 'campaign' ? MAX_CAMPAIGN_PAGES : 1;

  for (let page = 0; page < maxPages; page += 1) {
    const params = new URLSearchParams({
      fields: fields.join(','),
      level,
      time_range: metaTimeRange(from, to),
      limit: String(PAGE_LIMIT),
      use_unified_attribution_setting: 'true',
    });
    if (after) params.set('after', after);

    const response = await fetchWithTimeout(
      `${META_API_ROOT}/act_${accountId}/insights?${params.toString()}`,
      { headers: { authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) throw new Error(`Meta Ads Insights request failed (${response.status})`);

    const body = await response.json() as MetaInsightsResponse;
    const pageRows = Array.isArray(body.data) ? body.data : [];
    rows.push(...pageRows);
    after = body.paging?.cursors?.after;
    if (!after || pageRows.length === 0) {
      after = undefined;
      break;
    }
  }

  if (after) throw new Error('Meta Ads Insights pagination exceeded safe page limit');
  return rows;
}

function aggregate(rows: MetaInsightRow[]): MetaAggregate {
  const row = rows[0];
  return {
    currency: row?.account_currency?.trim() || null,
    spend: round(numberValue(row?.spend)),
    impressions: Math.round(numberValue(row?.impressions)),
    reach: Math.round(numberValue(row?.reach)),
    clicks: Math.round(numberValue(row?.clicks)),
    ctr: round(numberValue(row?.ctr)),
    cpc: round(numberValue(row?.cpc)),
    cpm: round(numberValue(row?.cpm)),
  };
}

function campaignRows(rows: MetaInsightRow[]): MetaCampaignRow[] {
  return rows
    .map((row) => ({
      campaignId: row.campaign_id?.trim() ?? '',
      campaignName: row.campaign_name?.trim() || row.campaign_id?.trim() || 'Ads campaign',
      spend: round(numberValue(row.spend)),
      impressions: Math.round(numberValue(row.impressions)),
      reach: Math.round(numberValue(row.reach)),
      clicks: Math.round(numberValue(row.clicks)),
      ctr: round(numberValue(row.ctr)),
      cpc: round(numberValue(row.cpc)),
      cpm: round(numberValue(row.cpm)),
    }))
    .filter((row) => row.campaignId)
    .sort((a, b) => b.spend - a.spend || b.clicks - a.clicks);
}

function unavailableMeta(detail: string): MetaAdsMetrics {
  return {
    status: providerStatus('meta', 'unavailable', detail),
    currency: null,
    spend: metric(0, 0),
    impressions: metric(0, 0),
    reach: metric(0, 0),
    clicks: metric(0, 0),
    ctr: metric(0, 0),
    cpc: metric(0, 0),
    cpm: metric(0, 0),
    campaigns: [],
    reportingNote: 'Meta Ads Insights calendar-date granularity ilə işləyir; saat əsaslı interval seçiləndə həmin intervalın toxunduğu Bakı tarixləri müqayisə olunur.',
  };
}

async function loadMetaAdsMetrics(range: DateRange): Promise<MetaAdsMetrics> {
  const accessToken = process.env.META_ACCESS_TOKEN?.trim();
  const rawAccountId = process.env.META_AD_ACCOUNT_ID?.trim();
  const missing = [
    ['META_ACCESS_TOKEN', accessToken],
    ['META_AD_ACCOUNT_ID', rawAccountId],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) return unavailableMeta(`Konfiqurasiya yoxdur: ${missing.join(', ')}`);

  try {
    const accountId = normalizeAccountId(rawAccountId!);
    const [currentRows, previousRows, campaigns] = await Promise.all([
      requestInsights(accountId, accessToken!, ACCOUNT_FIELDS, range.from, range.to, 'account'),
      requestInsights(accountId, accessToken!, ACCOUNT_FIELDS, range.previousFrom, range.previousTo, 'account'),
      requestInsights(accountId, accessToken!, CAMPAIGN_FIELDS, range.from, range.to, 'campaign'),
    ]);
    const current = aggregate(currentRows);
    const previous = aggregate(previousRows);

    return {
      status: providerStatus(
        'meta',
        'ready',
        `Meta Ads read-only · ${current.spend.toFixed(2)} ${current.currency ?? ''} spend · ${current.clicks} click · ${current.impressions} impression`.trim(),
      ),
      currency: current.currency ?? previous.currency,
      spend: metric(current.spend, previous.spend),
      impressions: metric(current.impressions, previous.impressions),
      reach: metric(current.reach, previous.reach),
      clicks: metric(current.clicks, previous.clicks),
      ctr: metric(current.ctr, previous.ctr),
      cpc: metric(current.cpc, previous.cpc),
      cpm: metric(current.cpm, previous.cpm),
      campaigns: campaignRows(campaigns),
      reportingNote: 'Meta Ads Insights calendar-date granularity ilə işləyir; saat əsaslı interval seçiləndə həmin intervalın toxunduğu Bakı tarixləri müqayisə olunur.',
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Meta Ads Insights sorğusu uğursuz oldu';
    return { ...unavailableMeta(detail), status: providerStatus('meta', 'error', detail) };
  }
}

const cachedMetaAdsMetrics = unstable_cache(
  async (serializedRange: string) => loadMetaAdsMetrics(JSON.parse(serializedRange) as DateRange),
  ['founder-analytics-meta-v1'],
  { revalidate: 300 },
);

export async function getMetaAdsMetrics(range: DateRange) {
  return cachedMetaAdsMetrics(JSON.stringify(range));
}
