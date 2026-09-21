import 'server-only';

import { unstable_cache } from 'next/cache';
import { createServerAdminClient } from '@/lib/supabase/server-admin';

export type ClubPopularityMetric = {
  slug: string;
  views: number;
  sessions: number;
};

type HogQLResponse = { columns?: string[]; results?: unknown[][] };

const CLUB_PATH_RE = /^\/klub\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const PAGE_SIZE = 1000;
const MAX_ROWS = 50_000;
const GAMEYER_POSTHOG_PROJECT_ID = '585472';
const GAMEYER_POSTHOG_HOST = 'https://us.posthog.com';
const SYNTHETIC_USER_AGENT_RE = /(bot|crawler|spider|headless|playwright|puppeteer|lighthouse)/i;

function slugFromPath(path: string) {
  const pathname = path.split('?')[0]?.split('#')[0] ?? '';
  return CLUB_PATH_RE.exec(pathname)?.[1] ?? null;
}

function sortMetrics(items: ClubPopularityMetric[]) {
  return [...items].sort((a, b) => b.views - a.views || b.sessions - a.sessions || a.slug.localeCompare(b.slug, 'az'));
}

async function querySupabasePopularity(): Promise<ClubPopularityMetric[]> {
  const supabase = createServerAdminClient();
  if (!supabase) return [];

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const aggregates = new Map<string, { views: number; sessions: Set<string> }>();

  for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('page_views')
      .select('path,session_id,user_agent')
      .gte('created_at', since)
      .like('path', '/klub/%')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('club popularity Supabase xətası:', error.message);
      return [];
    }

    const rows = data ?? [];
    for (const row of rows) {
      if (SYNTHETIC_USER_AGENT_RE.test(row.user_agent ?? '')) continue;
      const slug = slugFromPath(row.path);
      if (!slug) continue;
      const current = aggregates.get(slug) ?? { views: 0, sessions: new Set<string>() };
      current.views += 1;
      if (row.session_id) current.sessions.add(row.session_id);
      aggregates.set(slug, current);
    }

    if (rows.length < PAGE_SIZE) break;
  }

  return sortMetrics(
    [...aggregates.entries()].map(([slug, value]) => ({
      slug,
      views: value.views,
      sessions: value.sessions.size,
    })),
  );
}

async function queryPostHogPopularity(): Promise<ClubPopularityMetric[]> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  if (!apiKey) return [];

  const projectId = process.env.POSTHOG_PROJECT_ID?.trim() || GAMEYER_POSTHOG_PROJECT_ID;
  const configuredHost = process.env.POSTHOG_API_HOST?.trim().replace(/\/$/, '');
  const host = configuredHost === 'https://eu.posthog.com' || configuredHost === 'https://us.posthog.com'
    ? configuredHost
    : GAMEYER_POSTHOG_HOST;

  try {
    const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query: `
            SELECT
              properties.club_slug AS slug,
              count() AS views,
              uniq(properties.$session_id) AS sessions
            FROM events
            WHERE timestamp >= now() - INTERVAL 30 DAY
              AND properties.gameyer_traffic_scope = 'public'
              AND properties.$host = 'gameyer.az'
              AND (properties.$virt_is_bot != true OR isNull(properties.$virt_is_bot))
              AND event = 'club_view'
              AND notEmpty(properties.club_slug)
            GROUP BY slug
            ORDER BY views DESC, sessions DESC
            LIMIT 500
          `,
        },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return [];
    const payload = await response.json() as HogQLResponse;
    if (!Array.isArray(payload.columns) || !Array.isArray(payload.results)) return [];

    const slugIndex = payload.columns.indexOf('slug');
    const viewsIndex = payload.columns.indexOf('views');
    const sessionsIndex = payload.columns.indexOf('sessions');
    if (slugIndex < 0 || viewsIndex < 0 || sessionsIndex < 0) return [];

    return sortMetrics(payload.results.flatMap((row) => {
      const slug = typeof row[slugIndex] === 'string' ? row[slugIndex] : '';
      const views = Number(row[viewsIndex] ?? 0);
      const sessions = Number(row[sessionsIndex] ?? 0);
      return slug ? [{ slug, views: Number.isFinite(views) ? views : 0, sessions: Number.isFinite(sessions) ? sessions : 0 }] : [];
    }));
  } catch {
    return [];
  }
}

async function queryClubPopularityMetrics(): Promise<ClubPopularityMetric[]> {
  const firstParty = await querySupabasePopularity();
  if (firstParty.length > 0) return firstParty;

  // Production-safe fallback: if the server admin credential is unavailable,
  // use the already configured read-only PostHog provider instead of silently
  // falling back to alphabetical club ordering.
  return queryPostHogPopularity();
}

const getCachedClubPopularityMetrics = unstable_cache(
  queryClubPopularityMetrics,
  ['gameyer-club-popularity-30d-v3'],
  { revalidate: 600, tags: ['club-popularity'] },
);

export async function getClubPopularityMetrics() {
  return getCachedClubPopularityMetrics();
}
