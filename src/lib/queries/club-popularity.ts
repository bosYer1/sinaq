import 'server-only';

import { unstable_cache } from 'next/cache';
import { createServerAdminClient } from '@/lib/supabase/server-admin';

export type ClubPopularityMetric = {
  slug: string;
  views: number;
  sessions: number;
};

const CLUB_PATH_RE = /^\/klub\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const PAGE_SIZE = 1000;
const MAX_ROWS = 50_000;

function slugFromPath(path: string) {
  const pathname = path.split('?')[0]?.split('#')[0] ?? '';
  return CLUB_PATH_RE.exec(pathname)?.[1] ?? null;
}

async function queryClubPopularityMetrics(): Promise<ClubPopularityMetric[]> {
  const supabase = createServerAdminClient();
  if (!supabase) return [];

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const aggregates = new Map<string, { views: number; sessions: Set<string> }>();

  for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('page_views')
      .select('path,session_id')
      .gte('created_at', since)
      .like('path', '/klub/%')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('club popularity analytics xətası:', error.message);
      return [];
    }

    const rows = data ?? [];
    for (const row of rows) {
      const slug = slugFromPath(row.path);
      if (!slug) continue;
      const current = aggregates.get(slug) ?? { views: 0, sessions: new Set<string>() };
      current.views += 1;
      if (row.session_id) current.sessions.add(row.session_id);
      aggregates.set(slug, current);
    }

    if (rows.length < PAGE_SIZE) break;
  }

  return [...aggregates.entries()]
    .map(([slug, value]) => ({ slug, views: value.views, sessions: value.sessions.size }))
    .sort((a, b) => b.sessions - a.sessions || b.views - a.views || a.slug.localeCompare(b.slug, 'az'));
}

const getCachedClubPopularityMetrics = unstable_cache(
  queryClubPopularityMetrics,
  ['gameyer-club-popularity-30d-v1'],
  { revalidate: 600, tags: ['club-popularity'] },
);

export async function getClubPopularityMetrics() {
  return getCachedClubPopularityMetrics();
}
