import 'server-only';
import type { ClubWithRelations, District, ClubType } from '@/types/database';
import { unstable_cache } from 'next/cache';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { isPremiumActive } from '@/lib/utils';
import recoveredMedia from '@/data/recovered-club-media.json';

/** Temporary read-only recovery source review deadline. */
export const EMERGENCY_NEON_REVIEW_DATE = '2026-10-19';

export function temporaryCatalogConfigured(): boolean {
  return process.env.GAMEYER_NEON_EMERGENCY_READS === '1';
}

export function emergencyNeonCatalogEnabled(): boolean {
  return temporaryCatalogConfigured() && Boolean(process.env.GAMEYER_NEON_CATALOG_DATABASE_URL);
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
    signal: AbortSignal.timeout(10_000),
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
  const clubs = await readPublicRows<ClubWithRelations>(
    'SELECT club FROM gameyer_public.club_catalog_v1 ORDER BY slug',
  );
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
}, ['gameyer-neon-emergency-public-media-20261012'], { revalidate: 300 });

export async function getEmergencyPublicClubs(): Promise<ClubWithRelations[]> {
  return cachedEmergencyClubs();
}

const cachedEmergencyDistricts = unstable_cache(
  () => readPublicRows<District>(
    'SELECT to_jsonb(d) FROM (SELECT id, name, slug, created_at FROM gameyer_catalog.districts) d',
  ),
  ['gameyer-neon-emergency-districts-20261012'],
  { revalidate: 3600 },
);

export async function getEmergencyDistricts(): Promise<District[]> {
  return (await cachedEmergencyDistricts()).sort((a, b) => a.name.localeCompare(b.name, 'az'));
}

const cachedEmergencyTypes = unstable_cache(
  () => readPublicRows<ClubType>(
    'SELECT to_jsonb(t) FROM (SELECT id, name, slug FROM gameyer_catalog.club_types) t',
  ),
  ['gameyer-neon-emergency-types-20261012'],
  { revalidate: 3600 },
);

export async function getEmergencyClubTypes(): Promise<ClubType[]> {
  return (await cachedEmergencyTypes()).sort((a, b) => a.name.localeCompare(b.name, 'az'));
}
