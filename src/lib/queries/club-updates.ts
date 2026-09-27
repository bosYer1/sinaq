import { cache } from 'react';
import { createServerDataClient } from '@/lib/supabase/server-data';
import { getClubs } from '@/lib/queries/clubs';

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
    profile_image_url: string | null;
    district: { name: string; slug: string } | null;
  };
}

function createClubUpdatesClient() {
  return createServerDataClient();
}

function firstRelatedRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function queryActiveClubUpdates(clubId?: string): Promise<ClubUpdateItem[]> {
  const supabase = createClubUpdatesClient();
  const publicClubs = await getClubs();
  const publicClubIds = publicClubs.map((club) => club.id);
  if (publicClubIds.length === 0) return [];
  if (clubId && !publicClubIds.includes(clubId)) return [];

  const nowIso = new Date().toISOString();

  let query = supabase
    .from('club_updates')
    .select(`
      id, club_id, kind, title, description, starts_at, ends_at, reverify_after,
      source_type, source_url, verified_at,
      club:clubs!inner (
        id, name, slug, profile_image_url,
        district:districts ( name, slug )
      )
    `)
    .eq('is_active', true)
    .in('club_id', publicClubIds)
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
        profile_image_url: typeof club.profile_image_url === 'string' ? club.profile_image_url : null,
        district: district ? { name: district.name, slug: district.slug } : null,
      },
    }];
  });
}

const getCachedActiveClubUpdates = cache(
  async (clubId?: string) => queryActiveClubUpdates(clubId),
);

export async function getActiveClubUpdates(): Promise<ClubUpdateItem[]> {
  return getCachedActiveClubUpdates();
}

export async function getActiveClubUpdatesByClubId(clubId: string): Promise<ClubUpdateItem[]> {
  return getCachedActiveClubUpdates(clubId);
}
