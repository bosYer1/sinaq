import type { Club, ClubFilters, MappableClub } from '@/types/club';
import { getSupabaseClient } from '@/lib/supabase';
import { createRequestCoordinator, withRequestTimeout } from '@/lib/request';

const REQUEST_TIMEOUT_MS = 15_000;
const DETAIL_CACHE_MS = 5 * 60_000;
const listRequests = createRequestCoordinator<Club[]>();
const detailRequests = createRequestCoordinator<Club | null>(DETAIL_CACHE_MS);
const searchIndex = new WeakMap<Club, string>();

const LIST_SELECT = `
  id, name, slug, address, latitude, longitude,
  is_premium, premium_expires_at, is_verified, updated_at,
  district:districts ( id, name, slug ),
  type_assignments:club_type_assignments (
    club_type:club_types ( id, name, slug )
  ),
  pricing:club_pricing (
    id, price_from, price_to, unit,
    club_type:club_types ( id, name, slug )
  ),
  images:club_images ( id, url, is_cover, position )
`;

const DETAIL_SELECT = `
  id, name, slug, description, address, latitude, longitude,
  phone, instagram_url, is_premium, premium_expires_at,
  is_verified, verified_at, updated_at,
  district:districts ( id, name, slug ),
  type_assignments:club_type_assignments (
    club_type:club_types ( id, name, slug )
  ),
  pricing:club_pricing (
    id, price_from, price_to, unit,
    club_type:club_types ( id, name, slug )
  ),
  images:club_images ( id, url, is_cover, position ),
  opening_hours:club_opening_hours (
    id, day_of_week, open_time, close_time, is_closed
  )
`;

export function normalizeClub(club: Club): Club {
  return {
    ...club,
    name: club.name.trim(),
    address: typeof club.address === 'string' ? club.address.trim() : '',
    description: club.description ?? null,
    phone: club.phone ?? null,
    instagram_url: club.instagram_url ?? null,
    verified_at: club.verified_at ?? null,
    district: club.district && typeof club.district.name === 'string' ? club.district : null,
    type_assignments: Array.isArray(club.type_assignments)
      ? club.type_assignments.filter((assignment) => assignment && typeof assignment === 'object')
      : [],
    pricing: Array.isArray(club.pricing)
      ? club.pricing.filter((price) => price && typeof price.id === 'string' && Number.isFinite(price.price_from))
      : [],
    images: Array.isArray(club.images)
      ? club.images.filter((image) => image && typeof image.id === 'string' && safeHttpsUrl(image.url)).sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position)
      : [],
    opening_hours: Array.isArray(club.opening_hours)
      ? club.opening_hours.filter((hours) => hours && hours.day_of_week >= 0 && hours.day_of_week <= 6).sort((a, b) => a.day_of_week - b.day_of_week)
      : [],
  };
}

function safeHttpsUrl(value: unknown) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function fetchClubs(): Promise<Club[]> {
  return listRequests.run('active-clubs', () => withRequestTimeout(async (signal) => {
    const { data, error } = await getSupabaseClient()
      .from('clubs')
      .select(LIST_SELECT)
      .eq('is_active', true)
      .order('is_premium', { ascending: false })
      .order('name', { ascending: true })
      .abortSignal(signal)
      .returns<Club[]>();

    if (error) throw new Error('Klub məlumatları hazırda alınmadı. Yenidən cəhd edin.');
    return (data ?? []).filter(isUsableClub).map(normalizeClub);
  }, REQUEST_TIMEOUT_MS));
}

export function validClubSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 120;
}

export function fetchClubBySlug(slug: string, force = false): Promise<Club | null> {
  if (!validClubSlug(slug)) return Promise.resolve(null);
  return detailRequests.run(slug, () => withRequestTimeout(async (signal) => {
    const { data, error } = await getSupabaseClient()
      .from('clubs')
      .select(DETAIL_SELECT)
      .eq('slug', slug)
      .eq('is_active', true)
      .abortSignal(signal)
      .maybeSingle()
      .returns<Club>();
    if (error) throw new Error('Klub məlumatı hazırda alınmadı. Yenidən cəhd edin.');
    return data && isUsableClub(data) ? normalizeClub(data) : null;
  }, REQUEST_TIMEOUT_MS), force);
}

function isUsableClub(club: Club) {
  return Boolean(club && typeof club.id === 'string' && club.id && typeof club.name === 'string' && club.name.trim() && typeof club.slug === 'string' && validClubSlug(club.slug));
}

export function filterClubs(clubs: Club[], filters: ClubFilters) {
  const query = normalizeSearchText(filters.query);

  return clubs.filter((club) => {
    if (filters.verifiedOnly && !club.is_verified) return false;
    if (filters.district && club.district?.slug !== filters.district) return false;
    if (
      filters.type &&
      !club.type_assignments.some((assignment) => assignment.club_type?.slug === filters.type)
    ) return false;
    if (!query) return true;

    let indexed = searchIndex.get(club);
    if (!indexed) {
      indexed = normalizeSearchText([club.name, club.address, club.district?.name, club.slug].filter(Boolean).join(' '));
      searchIndex.set(club, indexed);
    }
    return indexed.includes(query);
  });
}

export function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase('az-AZ');
}

export function clubsWithCoordinates(clubs: Club[]) {
  return clubs.filter((club): club is MappableClub => (
    club.latitude != null && club.longitude != null &&
    Number.isFinite(club.latitude) && Number.isFinite(club.longitude) &&
    club.latitude >= -90 && club.latitude <= 90 &&
    club.longitude >= -180 && club.longitude <= 180
  ));
}

export function clubTypeLabels(club: Club) {
  return club.type_assignments
    .map((assignment) => assignment.club_type?.name)
    .filter((name): name is string => Boolean(name));
}

export function coverImage(club: Club) {
  return club.images[0]?.url ?? null;
}

export function cheapestPrice(club: Club) {
  return club.pricing.reduce<Club['pricing'][number] | null>((cheapest, price) => {
    if (!Number.isFinite(price.price_from) || price.price_from <= 0) return cheapest;
    return !cheapest || price.price_from < cheapest.price_from ? price : cheapest;
  }, null);
}
