import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { assertSupabaseConfig, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/public-config';

export type ClubUpdateKind = 'tournament' | 'offer';

export interface ClubUpdateItem {
  id: string;
  club_id: string;
  kind: ClubUpdateKind;
  title: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  reverify_after: string | null;
  source_type: 'official_instagram' | 'official_website' | 'owner_submission' | 'other';
  source_url: string;
  verified_at: string;
  club: {
    id: string;
    name: string;
    slug: string;
    district: { name: string; slug: string } | null;
  };
}

function createClubUpdatesClient() {
  assertSupabaseConfig();
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function firstRelatedRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function queryActiveClubUpdates(clubId?: string): Promise<ClubUpdateItem[]> {
  const supabase = createClubUpdatesClient();
  const nowIso = new Date().toISOString();

  let query = supabase
    .from('club_updates')
    .select(`
      id, club_id, kind, title, description, starts_at, ends_at, reverify_after,
      source_type, source_url, verified_at,
      club:clubs!inner (
        id, name, slug,
        district:districts ( name, slug )
      )
    `)
    .eq('is_active', true)
    .or(`ends_at.gt.${nowIso},and(kind.eq.offer,ends_at.is.null,reverify_after.gt.${nowIso})`)
    .order('starts_at', { ascending: true, nullsFirst: false })
    .order('ends_at', { ascending: true, nullsFirst: false })
    .limit(24);

  if (clubId) query = query.eq('club_id', clubId);

  const { data, error } = await query;
  if (error) {
    console.error('getActiveClubUpdates xətası:', error.message);
    return [];
  }

  const now = Date.now();
  return (data ?? []).flatMap((item) => {
    const endsAt = item.ends_at ? new Date(item.ends_at).getTime() : null;
    const reverifyAfter = item.reverify_after ? new Date(item.reverify_after).getTime() : null;
    const hasLiveExpiry = endsAt !== null && Number.isFinite(endsAt) && endsAt > now;
    const hasFreshOngoingVerification = item.kind === 'offer'
      && endsAt === null
      && reverifyAfter !== null
      && Number.isFinite(reverifyAfter)
      && reverifyAfter > now;

    if (!hasLiveExpiry && !hasFreshOngoingVerification) return [];

    const club = firstRelatedRow(item.club);
    if (!club) return [];
    const district = firstRelatedRow(club.district);

    return [{
      id: item.id,
      club_id: item.club_id,
      kind: item.kind as ClubUpdateKind,
      title: item.title,
      description: item.description,
      starts_at: item.starts_at,
      ends_at: item.ends_at,
      reverify_after: item.reverify_after,
      source_type: item.source_type as ClubUpdateItem['source_type'],
      source_url: item.source_url,
      verified_at: item.verified_at,
      club: {
        id: club.id,
        name: club.name,
        slug: club.slug,
        district: district ? { name: district.name, slug: district.slug } : null,
      },
    }];
  });
}

const getCachedActiveClubUpdates = unstable_cache(
  async (clubId?: string) => queryActiveClubUpdates(clubId),
  ['gameyer-active-club-updates-v3'],
  { revalidate: 60, tags: ['club-updates'] },
);

export async function getActiveClubUpdates(): Promise<ClubUpdateItem[]> {
  return getCachedActiveClubUpdates();
}

export async function getActiveClubUpdatesByClubId(clubId: string): Promise<ClubUpdateItem[]> {
  return getCachedActiveClubUpdates(clubId);
}
