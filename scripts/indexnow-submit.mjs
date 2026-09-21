const DEFAULT_SITE_URL = 'https://gameyer.az';
const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'df8fa4723f76653caecfd894a38ef608';

function argValue(prefix) {
  const arg = process.argv.find((value) => value.startsWith(`${prefix}=`));
  return arg ? arg.slice(prefix.length + 1) : null;
}

const siteUrl = (process.env.INDEXNOW_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
const endpoint = process.env.INDEXNOW_ENDPOINT || DEFAULT_ENDPOINT;
const all = process.argv.includes('--all');
const dryRun = process.argv.includes('--dry-run');
const daysRaw = argValue('--days');
const days = daysRaw == null ? 7 : Number(daysRaw);

if (!all && (!Number.isFinite(days) || days < 0 || days > 3650)) {
  throw new Error('--days must be a number between 0 and 3650.');
}

if (!/^[A-Za-z0-9-]{8,128}$/.test(INDEXNOW_KEY)) {
  throw new Error('INDEXNOW_KEY must be 8-128 letters, numbers, or dashes.');
}

const site = new URL(siteUrl);
const sitemapUrl = `${siteUrl}/sitemap.xml`;
const keyLocation = `${siteUrl}/${INDEXNOW_KEY}.txt`;

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

function extractEntries(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => {
    const block = match[1];
    const locMatch = block.match(/<loc>([\s\S]*?)<\/loc>/);
    const lastmodMatch = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/);
    return {
      loc: locMatch ? decodeXml(locMatch[1].trim()) : null,
      lastmod: lastmodMatch ? lastmodMatch[1].trim() : null,
    };
  }).filter((entry) => entry.loc);
}

function sameHost(url) {
  try {
    return new URL(url).host === site.host;
  } catch {
    return false;
  }
}

const sitemapResponse = await fetch(sitemapUrl, {
  headers: { 'user-agent': 'GameYer-IndexNow/1.0' },
});

if (!sitemapResponse.ok) {
  throw new Error(`Failed to fetch sitemap (${sitemapResponse.status}).`);
}

const xml = await sitemapResponse.text();
const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
const selected = extractEntries(xml)
  .filter((entry) => sameHost(entry.loc))
  .filter((entry) => {
    if (all) return true;
    if (!entry.lastmod) return false;
    const timestamp = Date.parse(entry.lastmod);
    return Number.isFinite(timestamp) && timestamp >= cutoff;
  })
  .map((entry) => entry.loc);

const urlList = [...new Set(selected)].slice(0, 10_000);

if (urlList.length === 0) {
  console.log(`IndexNow: no ${all ? '' : `last-${days}-day `}sitemap URLs selected.`);
  process.exit(0);
}

const payload = {
  host: site.host,
  key: INDEXNOW_KEY,
  keyLocation,
  urlList,
};

if (dryRun) {
  console.log(JSON.stringify({
    endpoint,
    sitemapUrl,
    keyLocation,
    count: urlList.length,
    urlList,
  }, null, 2));
  process.exit(0);
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
});

if (![200, 202].includes(response.status)) {
  const body = await response.text();
  throw new Error(`IndexNow submission failed (${response.status}): ${body.slice(0, 500)}`);
}

console.log(`IndexNow: submitted ${urlList.length} URL(s), status ${response.status}.`);
