import { createSign } from 'node:crypto';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const GA4_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const GSC_API_ROOT = 'https://searchconsole.googleapis.com/webmasters/v3';
const GA4_API_ROOT = 'https://analyticsdata.googleapis.com/v1beta';
const DEFAULT_POSTHOG_HOST = 'https://us.posthog.com';
const META_API_ROOT = 'https://graph.facebook.com/v26.0';
const ARCHIVE_SOURCE_VERSION = 'v1';
const ROWS_PER_CHUNK = 400;

function arg(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) || '';
}

function bakuDateDaysAgo(days) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baku',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Date.now() - days * 86_400_000));
}

const archiveDate = arg('date') || process.env.ARCHIVE_DATE?.trim() || bakuDateDaysAgo(3);
if (!/^\d{4}-\d{2}-\d{2}$/.test(archiveDate)) throw new Error('ARCHIVE_DATE must be YYYY-MM-DD');

function env(name) {
  return process.env[name]?.trim() || '';
}

function chunks(rows, size = ROWS_PER_CHUNK) {
  const output = [];
  for (let index = 0; index < rows.length; index += size) output.push(rows.slice(index, index + size));
  return output.length > 0 ? output : [[]];
}

function snapshot(provider, dataset, payload, rowCount = null, chunkIndex = 0) {
  return {
    provider,
    snapshot_date: archiveDate,
    dataset,
    chunk_index: chunkIndex,
    row_count: rowCount ?? (Array.isArray(payload) ? payload.length : 1),
    payload,
    source_version: ARCHIVE_SOURCE_VERSION,
  };
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function normalizePrivateKey(value) {
  return value.replace(/\\n/g, '\n').trim();
}

function createGoogleAssertion(clientEmail, privateKey, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = encodeBase64Url(JSON.stringify({
    iss: clientEmail,
    scope,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${signer.sign(normalizePrivateKey(privateKey)).toString('base64url')}`;
}

async function googleAccessToken(clientEmail, privateKey, scope) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: createGoogleAssertion(clientEmail, privateKey, scope),
    }).toString(),
  });
  if (!response.ok) throw new Error(`Google OAuth failed (${response.status})`);
  const body = await response.json();
  if (typeof body.access_token !== 'string' || !body.access_token) throw new Error('Google OAuth returned no access token');
  return body.access_token;
}

async function gscQuery(siteUrl, token, dimensions = [], startRow = 0, rowLimit = 25000) {
  const response = await fetch(`${GSC_API_ROOT}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      startDate: archiveDate,
      endDate: archiveDate,
      type: 'web',
      dimensions,
      rowLimit,
      startRow,
      dataState: 'final',
    }),
  });
  if (!response.ok) throw new Error(`GSC Search Analytics failed (${response.status})`);
  const body = await response.json();
  return Array.isArray(body.rows) ? body.rows : [];
}

async function collectGsc() {
  const siteUrl = env('GSC_SITE_URL');
  const clientEmail = env('GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL') || env('GOOGLE_PROVIDER_CLIENT_EMAIL');
  const privateKey = env('GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY') || env('GOOGLE_PROVIDER_PRIVATE_KEY');
  if (!siteUrl || !clientEmail || !privateKey) return { name: 'gsc', configured: false, snapshots: [] };

  const token = await googleAccessToken(clientEmail, privateKey, GSC_SCOPE);
  const summaryRows = await gscQuery(siteUrl, token, [], 0, 1);
  const summary = summaryRows[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  const queryPageRows = [];
  for (let startRow = 0; startRow < 100000; startRow += 25000) {
    const page = await gscQuery(siteUrl, token, ['query', 'page'], startRow, 25000);
    queryPageRows.push(...page);
    if (page.length < 25000) break;
  }

  const output = [snapshot('gsc', 'summary', summary)];
  chunks(queryPageRows).forEach((rows, index) => {
    output.push(snapshot('gsc', 'query_page', rows, rows.length, index));
  });
  return { name: 'gsc', configured: true, snapshots: output };
}

async function ga4Report(propertyId, token, dimensions, metrics) {
  const response = await fetch(`${GA4_API_ROOT}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: archiveDate, endDate: archiveDate }],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      limit: '100000',
      keepEmptyRows: true,
    }),
  });
  if (!response.ok) throw new Error(`GA4 Data API failed (${response.status})`);
  return response.json();
}

function ga4Rows(body) {
  const dimensions = (body.dimensionHeaders ?? []).map((item) => item.name);
  const metrics = (body.metricHeaders ?? []).map((item) => item.name);
  return (body.rows ?? []).map((row) => {
    const value = {};
    dimensions.forEach((name, index) => { value[name] = row.dimensionValues?.[index]?.value ?? ''; });
    metrics.forEach((name, index) => { value[name] = Number(row.metricValues?.[index]?.value ?? 0); });
    return value;
  });
}

async function collectGa4() {
  const propertyId = env('GA4_PROPERTY_ID');
  const clientEmail = env('GOOGLE_ANALYTICS_CLIENT_EMAIL') || env('GOOGLE_PROVIDER_CLIENT_EMAIL');
  const privateKey = env('GOOGLE_ANALYTICS_PRIVATE_KEY') || env('GOOGLE_PROVIDER_PRIVATE_KEY');
  if (!propertyId || !clientEmail || !privateKey) return { name: 'ga4', configured: false, snapshots: [] };
  if (!/^\d+$/.test(propertyId)) throw new Error('GA4_PROPERTY_ID is invalid');

  const token = await googleAccessToken(clientEmail, privateKey, GA4_SCOPE);
  const metricNames = [
    'sessions', 'activeUsers', 'totalUsers', 'newUsers', 'screenPageViews',
    'engagementRate', 'bounceRate', 'averageSessionDuration', 'eventCount', 'keyEvents',
  ];
  const [summaryBody, channelBody] = await Promise.all([
    ga4Report(propertyId, token, [], metricNames),
    ga4Report(propertyId, token, ['sessionDefaultChannelGroup', 'sessionSourceMedium'], ['sessions', 'activeUsers', 'screenPageViews', 'engagedSessions']),
  ]);

  return {
    name: 'ga4',
    configured: true,
    snapshots: [
      snapshot('ga4', 'summary', ga4Rows(summaryBody)[0] ?? {}),
      snapshot('ga4', 'channels', ga4Rows(channelBody), ga4Rows(channelBody).length),
    ],
  };
}

async function collectPostHog() {
  const apiKey = env('POSTHOG_PERSONAL_API_KEY');
  const projectId = env('POSTHOG_PROJECT_ID') || '585472';
  const host = (env('POSTHOG_API_HOST') || DEFAULT_POSTHOG_HOST).replace(/\/$/, '');
  if (!apiKey) return { name: 'posthog', configured: false, snapshots: [] };
  if (!['https://us.posthog.com', 'https://eu.posthog.com'].includes(host)) throw new Error('POSTHOG_API_HOST is not allowed');

  const date = archiveDate.replaceAll("'", '');
  const query = `
    SELECT
      countIf(event = '$pageview') AS pageviews,
      uniqIf(person_id, event = '$pageview') AS users,
      uniqIf(person_id, event = 'club_view') AS club_view_users,
      uniqIf(person_id, event IN ('phone_click','instagram_click','maps_click','whatsapp_booking_click','tiktok_click')) AS outbound_users,
      countIf(event = 'search_query') AS searches,
      countIf(event = 'filter_changed') AS filter_changes
    FROM events
    WHERE toDate(toTimeZone(timestamp, 'Asia/Baku')) = toDate('${date}')
      AND properties.gameyer_traffic_scope = 'public'
      AND coalesce(properties.gameyer_analytics_test, false) = false
      AND NOT isLikelyBot(properties.$raw_user_agent)
  `;

  const response = await fetch(`${host}/api/projects/${encodeURIComponent(projectId)}/query/`, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  });
  if (!response.ok) throw new Error(`PostHog query failed (${response.status})`);
  const body = await response.json();
  const columns = Array.isArray(body.columns) ? body.columns : [];
  const row = Array.isArray(body.results?.[0]) ? body.results[0] : [];
  const payload = Object.fromEntries(columns.map((name, index) => [name, row[index] ?? null]));
  return { name: 'posthog', configured: true, snapshots: [snapshot('posthog', 'summary', payload)] };
}

async function metaInsights(accountId, token, level, fields) {
  const params = new URLSearchParams({
    fields: fields.join(','),
    level,
    time_range: JSON.stringify({ since: archiveDate, until: archiveDate }),
    limit: '500',
    use_unified_attribution_setting: 'true',
  });
  const response = await fetch(`${META_API_ROOT}/act_${accountId}/insights?${params.toString()}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Meta Insights failed (${response.status})`);
  const body = await response.json();
  return Array.isArray(body.data) ? body.data : [];
}

async function collectMeta() {
  const token = env('META_ACCESS_TOKEN');
  const accountId = env('META_AD_ACCOUNT_ID').replace(/^act_/i, '');
  if (!token || !accountId) return { name: 'meta', configured: false, snapshots: [] };
  if (!/^\d+$/.test(accountId)) throw new Error('META_AD_ACCOUNT_ID is invalid');

  const fields = ['account_currency', 'spend', 'impressions', 'reach', 'clicks', 'ctr', 'cpc', 'cpm'];
  const campaignFields = ['campaign_id', 'campaign_name', ...fields.slice(1)];
  const [summaryRows, campaigns] = await Promise.all([
    metaInsights(accountId, token, 'account', fields),
    metaInsights(accountId, token, 'campaign', campaignFields),
  ]);
  return {
    name: 'meta',
    configured: true,
    snapshots: [
      snapshot('meta', 'summary', summaryRows[0] ?? {}),
      snapshot('meta', 'campaigns', campaigns, campaigns.length),
    ],
  };
}

async function persistSnapshots(snapshots) {
  const supabaseUrl = env('SUPABASE_URL');
  const oidc = env('GAMEYER_PROVIDER_ARCHIVE_OIDC_TOKEN');
  if (!supabaseUrl || !oidc) throw new Error('Archive persistence configuration is missing');

  for (let index = 0; index < snapshots.length; index += 50) {
    const batch = snapshots.slice(index, index + 50);
    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/gameyer-provider-archive-ingest`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-gameyer-github-oidc': oidc,
      },
      body: JSON.stringify({ snapshots: batch }),
    });
    if (!response.ok) throw new Error(`Provider archive ingest failed (${response.status})`);
  }
}

const collectors = [collectGsc, collectGa4, collectPostHog, collectMeta];
const results = [];
for (const collect of collectors) {
  try {
    results.push(await collect());
  } catch (error) {
    const name = collect.name.replace(/^collect/, '').toLowerCase();
    results.push({ name, configured: true, snapshots: [], error: error instanceof Error ? error.message : 'unknown error' });
  }
}

const snapshots = results.flatMap((result) => result.snapshots);
if (snapshots.length === 0) {
  const missing = results.filter((result) => !result.configured).map((result) => result.name);
  const failed = results.filter((result) => result.error).map((result) => result.name);
  throw new Error(`No provider snapshots produced. Missing: ${missing.join(', ') || 'none'}; failed: ${failed.join(', ') || 'none'}`);
}

await persistSnapshots(snapshots);

console.log(JSON.stringify({
  ok: true,
  archiveDate,
  storedSnapshots: snapshots.length,
  providers: results.map((result) => ({
    provider: result.name,
    configured: result.configured,
    datasets: result.snapshots.map((item) => item.dataset),
    error: result.error ?? null,
  })),
}, null, 2));
