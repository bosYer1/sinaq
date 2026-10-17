import 'server-only';
import type { ClubWithRelations, District, ClubType } from '@/types/database';
import { unstable_cache } from 'next/cache';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { isPremiumActive } from '@/lib/utils';
import recoveredMedia from '@/data/recovered-club-media.json';
import fallbackCatalog from '@/data/neon-public-catalog-snapshot.json';
import fallbackFacets from '@/data/neon-public-facets-snapshot.json';

/** Temporary public-only recovery snapshot: mandatory review on 2026-10-19. */
export const EMERGENCY_NEON_REVIEW_DATE = '2026-10-19';

/**
 * Static recovery reduces database compute AND egress to zero on normal reads.
 * This is safe only while new submissions and catalogue writes remain paused.
 * The feature automatically expires so a stale snapshot cannot silently persist.
 */
export function pinnedPublicRecoverySnapshotEnabled(): boolean {
  return process.env.GAMEYER_NEON_STATIC_CATALOG === '1'
    && process.env.GAMEYER_NEON_EMERGENCY_READS === '1'
    && Date.now() <= Date.parse(`${EMERGENCY_NEON_REVIEW_DATE}T23:59:59Z`);
}

export function temporaryCatalogConfigured(): boolean {
  return process.env.GAMEYER_NEON_EMERGENCY_READS === '1';
}

export function emergencyNeonCatalogEnabled(): boolean {
  return temporaryCatalogConfigured() && (
    pinnedPublicRecoverySnapshotEnabled() || Boolean(process.env.GAMEYER_NEON_CATALOG_DATABASE_URL)
  );
}

async function readPublicRows<T>(query: string): Promise<T[]> {
  if (!emergencyNeonCatalogEnabled()) throw new Error('Emergency read unavailable.');
  const connectionString = process.env.GAMEYER_NEON_CATALOG_DATABASE_URL!;
  const url = new URL(connectionString);
  // Restrict this temporary server credential to its non-privileged,
  // public-catalog-only role; never accept an owner/admin database URL.
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || url.username !== 'gameyer_catalog_login'
    || url.pathname !== '/gameyer'
    || !url.hostname.endsWith('.neon.tech')) {
    throw new Error('Emergency catalog connection must use the approved read-only role.');
  }
  const response = await fetch(`https://${url.hostname}/sql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'Neon-Connection-String': connectionString, 'Neon-Array-Mode': 'true', 'Neon-Raw-Text-Output': 'true' },
    body: JSON.stringify({ query, params: [] }),
    cache: 'no-store',
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Emergency catalog read status ${response.status}.`);
  const payload = await response.json() as { rows?: unknown[][] };
  if (!Array.isArray(payload.rows)) throw new Error('Invalid emergency catalog rows.');
  return payload.rows.map(row => {
    if (!Array.isArray(row) || row.length !== 1) throw new Error('Malformed catalog row.');
    return (typeof row[0] === 'string' ? JSON.parse(row[0]) : row[0]) as T;
  });
}

const cachedEmergencyClubs = unstable_cache(async (): Promise<ClubWithRelations[]> => {
  // Public catalog changes infrequently while submissions and writes are paused.
  // A bounded local snapshot protects visitors from brief free-tier cold starts or
  // quota errors, without retry storms or leaking unpublished clubs.
  let clubs: ClubWithRelations[];
  if (pinnedPublicRecoverySnapshotEnabled()) {
    clubs = fallbackCatalog.clubs as unknown as ClubWithRelations[];
  } else {
    try {
      clubs = await readPublicRows<ClubWithRelations>(
        'SELECT club FROM gameyer_public.club_catalog_v1 ORDER BY slug',
      );
    } catch (error) {
      if (Date.now() > Date.parse(`${fallbackCatalog.review_by}T23:59:59Z`)) throw error;
      console.error('Neon public catalog unavailable; using pre-approved public-only snapshot.');
      clubs = fallbackCatalog.clubs as unknown as ClubWithRelations[];
    }
  }
  if (clubs.length === 0 || clubs.some(club =>
    !club.is_active || club.latitude == null || club.longitude == null
    || !(club.instagram_url?.trim() || club.tiktok_url?.trim())
    || !inferClubTypeSlugs(club).some(type => type === 'pc' || type === 'playstation')
  )) throw new Error('Emergency public catalog eligibility violation.');
  const recoveredByOriginalUrl = recoveredMedia as Record<string, string>;
  const recoveredPhoto = (original: string | null): string | null => {
    if (!original) return null;
    const local = recoveredByOriginalUrl[original];
    return typeof local === 'string' && /^\/recovered-club-media\/[a-f0-9]{25}\.(jpg|png|webp)$/.test(local) ? local : null;
  };
  const blockedMedia = (url: string | null) =>
    Boolean(url?.includes('.supabase.co/storage/v1/'));
  // Supabase Storage also returns 402. Do not issue hundreds of broken
  // image requests, and never fabricate replacement club photographs.
  const clean = clubs.map(club => {
    const images = club.images.flatMap(image => {
      if (!blockedMedia(image.url)) return [image];
      const local = recoveredPhoto(image.url);
      return local ? [{ ...image, url: local }] : [];
    });
    const profile = blockedMedia(club.profile_image_url)
      ? recoveredPhoto(club.profile_image_url)
      : club.profile_image_url;
    // If the exact profile image was not cached, a genuine salvaged gallery
    // photo from the same verified club is preferable to a fake placeholder.
    return {
      ...club,
      profile_image_url: profile ?? images.find(image => image.is_cover)?.url ?? images[0]?.url ?? null,
      images,
    };
  });
  return clean.sort((a, b) =>
    Number(isPremiumActive(b)) - Number(isPremiumActive(a))
    || Number(Boolean(b.profile_image_url)) - Number(Boolean(a.profile_image_url))
    || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    || a.name.localeCompare(b.name, 'az')
  );
}, ['gameyer-neon-emergency-public-media-fallback-v2'], { revalidate: 3600 });

export async function getEmergencyPublicClubs(): Promise<ClubWithRelations[]> {
  return cachedEmergencyClubs();
}

const cachedEmergencyDistricts = unstable_cache(
  async (): Promise<District[]> => {
    if (pinnedPublicRecoverySnapshotEnabled()) return fallbackFacets.districts as District[];
    try {
      return await readPublicRows<District>(
        'SELECT to_jsonb(d) FROM (SELECT id, name, slug, created_at FROM gameyer_catalog.districts) d',
      );
    } catch (error) {
      if (Date.now() > Date.parse(`${fallbackFacets.review_by}T23:59:59Z`)) throw error;
      console.error('Neon district read unavailable; using approved public facets.');
      return fallbackFacets.districts as District[];
    }
  },
  ['gameyer-neon-emergency-districts-fallback-v2'],
  { revalidate: 86_400 },
);

export async function getEmergencyDistricts(): Promise<District[]> {
  return (await cachedEmergencyDistricts()).sort((a, b) => a.name.localeCompare(b.name, 'az'));
}

const cachedEmergencyTypes = unstable_cache(
  async (): Promise<ClubType[]> => {
    if (pinnedPublicRecoverySnapshotEnabled()) return fallbackFacets.types as ClubType[];
    try {
      return await readPublicRows<ClubType>(
        'SELECT to_jsonb(t) FROM (SELECT id, name, slug FROM gameyer_catalog.club_types) t',
      );
    } catch (error) {
      if (Date.now() > Date.parse(`${fallbackFacets.review_by}T23:59:59Z`)) throw error;
      console.error('Neon platform types unavailable; using approved public facets.');
      return fallbackFacets.types as ClubType[];
    }
  },
  ['gameyer-neon-emergency-types-fallback-v2'],
  { revalidate: 86_400 },
);

export async function getEmergencyClubTypes(): Promise<ClubType[]> {
  return (await cachedEmergencyTypes()).sort((a, b) => a.name.localeCompare(b.name, 'az'));
}
