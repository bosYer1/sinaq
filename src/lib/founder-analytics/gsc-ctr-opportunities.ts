import type { GscCtrOpportunity } from './types';

type QueryPageApiRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  position?: number;
};

type Candidate = Omit<GscCtrOpportunity, 'matchingPages'>;

const CANONICAL_ORIGIN = 'https://gameyer.az';
const MIN_IMPRESSIONS = 20;
const MAX_CTR_PERCENT = 5;
const MAX_POSITION = 20;

/**
 * Prioritize observed Search Console query + canonical page pairs.
 * No third-party keyword estimates, invented clicks, or guaranteed CTR targets.
 * The input is the bounded GSC API sample, not necessarily every anonymous query.
 */
export function prioritizeGscCtrOpportunities(
  rows: readonly QueryPageApiRow[],
  limit = 15,
): GscCtrOpportunity[] {
  const candidates: Candidate[] = [];
  const pagesByQuery = new Map<string, Set<string>>();

  for (const row of rows) {
    if (!Array.isArray(row.keys) || row.keys.length !== 2) continue;
    const query = row.keys[0]?.trim();
    const rawPage = row.keys[1]?.trim();
    if (!query || !rawPage) continue;

    let pathname: string;
    try {
      const url = new URL(rawPage);
      if (url.origin !== CANONICAL_ORIGIN || url.search || url.hash) continue;
      pathname = url.pathname;
    } catch {
      continue;
    }

    const clicks = Number(row.clicks ?? 0);
    const impressions = Number(row.impressions ?? 0);
    const position = Number(row.position ?? 0);
    if (
      !Number.isFinite(clicks) || !Number.isFinite(impressions) || !Number.isFinite(position)
      || clicks < 0 || impressions <= 0 || clicks > impressions || position <= 0
    ) continue;

    const queryKey = query.toLocaleLowerCase('az');
    const seen = pagesByQuery.get(queryKey) ?? new Set<string>();
    seen.add(pathname);
    pagesByQuery.set(queryKey, seen);

    const ctr = Math.round((clicks / impressions) * 10_000) / 100;
    if (impressions < MIN_IMPRESSIONS || position > MAX_POSITION || ctr > MAX_CTR_PERCENT) continue;
    candidates.push({
      query,
      path: pathname,
      clicks,
      impressions,
      ctr,
      position: Math.round(position * 100) / 100,
      nextAction: position <= 10 ? 'snippet' : 'ranking',
    });
  }

  const priorityBand = (row: Candidate) => (
    row.position <= 10 ? (row.clicks === 0 ? 0 : 1) : 2
  );

  return candidates
    .map((row) => ({
      ...row,
      matchingPages: pagesByQuery.get(row.query.toLocaleLowerCase('az'))?.size ?? 1,
    }))
    .sort((a, b) =>
      priorityBand(a) - priorityBand(b)
      || b.impressions - a.impressions
      || a.position - b.position
      || a.query.localeCompare(b.query, 'az')
      || a.path.localeCompare(b.path, 'az')
    )
    .slice(0, Math.max(0, Math.min(50, Math.floor(limit))));
}
