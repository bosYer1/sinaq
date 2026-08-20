import type { Club, ClubFilters, ClubType, MappableClub, OpeningHours } from '@/types/club';
import { getSupabaseClient } from '@/lib/supabase';
import { createRequestCoordinator, withRequestTimeout } from '@/lib/request';

const REQUEST_TIMEOUT_MS = 15_000;
const DETAIL_CACHE_MS = 5 * 60_000;
const listRequests = createRequestCoordinator<Club[]>();
const detailRequests = createRequestCoordinator<Club | null>(DETAIL_CACHE_MS);
const searchIndex = new WeakMap<Club, string>();
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

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
  const typeAssignments = Array.isArray(club.type_assignments)
    ? uniqueBy(
      club.type_assignments.filter(validTypeAssignment),
      (assignment) => assignment.club_type?.id ?? '',
    ).map((assignment) => ({ club_type: normalizeClubType(assignment.club_type) }))
    : [];
  const pricing = Array.isArray(club.pricing)
    ? uniqueBy(club.pricing.filter((price) => (
      price && typeof price.id === 'string' && price.id &&
      Number.isFinite(price.price_from) && price.price_from > 0 &&
      (price.price_to == null || (Number.isFinite(price.price_to) && price.price_to >= price.price_from)) &&
      typeof price.unit === 'string' && Boolean(price.unit.trim())
    )), (price) => price.id).map((price) => ({
      ...price,
      unit: cleanText(price.unit, 40),
      club_type: validClubType(price.club_type) ? normalizeClubType(price.club_type) : null,
    }))
    : [];
  const images = Array.isArray(club.images)
    ? uniqueBy(club.images.filter((image) => (
      image && typeof image.id === 'string' && image.id && safeHttpsUrl(image.url) &&
      typeof image.is_cover === 'boolean' && Number.isFinite(image.position)
    )), (image) => image.id).sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position)
    : [];
  const openingHours = Array.isArray(club.opening_hours)
    ? uniqueBy(club.opening_hours.filter(validOpeningHours), (hours) => String(hours.day_of_week))
      .sort((a, b) => a.day_of_week - b.day_of_week)
    : [];

  return {
    ...club,
    id: club.id.trim(),
    name: cleanText(club.name, 160),
    address: cleanText(club.address, 500),
    description: typeof club.description === 'string' ? cleanText(club.description, 5_000) || null : null,
    phone: typeof club.phone === 'string' ? cleanText(club.phone, 100) || null : null,
    instagram_url: typeof club.instagram_url === 'string' ? cleanText(club.instagram_url, 500) || null : null,
    is_premium: club.is_premium === true,
    is_verified: club.is_verified === true,
    verified_at: club.verified_at ?? null,
    district: validClubType(club.district) ? normalizeClubType(club.district) : null,
    type_assignments: typeAssignments,
    pricing,
    images,
    opening_hours: openingHours,
  };
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validClubType(value: unknown): value is ClubType {
  if (!value || typeof value !== 'object') return false;
  const type = value as Partial<ClubType>;
  return typeof type.id === 'string' && Boolean(type.id.trim()) &&
    typeof type.name === 'string' && Boolean(type.name.trim()) &&
    typeof type.slug === 'string' && validClubSlug(type.slug);
}

function validTypeAssignment(value: unknown): value is { club_type: ClubType } {
  if (!value || typeof value !== 'object' || !('club_type' in value)) return false;
  return validClubType(value.club_type);
}

function normalizeClubType(value: ClubType): ClubType {
  return { id: value.id.trim(), name: cleanText(value.name, 100), slug: value.slug };
}

function validOpeningHours(value: unknown): value is OpeningHours {
  if (!value || typeof value !== 'object') return false;
  const hours = value as Partial<OpeningHours>;
  const validTime = (time: unknown) => time == null || (typeof time === 'string' && TIME_PATTERN.test(time));
  return typeof hours.id === 'string' && Boolean(hours.id) &&
    Number.isInteger(hours.day_of_week) && Number(hours.day_of_week) >= 0 && Number(hours.day_of_week) <= 6 &&
    typeof hours.is_closed === 'boolean' && validTime(hours.open_time) && validTime(hours.close_time);
}

function uniqueBy<T>(values: T[], keyFor: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = keyFor(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

    if (error) throw publicQueryError(error, 'Klub məlumatları hazırda alınmadı. Yenidən cəhd edin.');
    return Array.isArray(data) ? data.filter(isUsableClub).map(normalizeClub) : [];
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
    if (error) throw publicQueryError(error, 'Klub məlumatı hazırda alınmadı. Yenidən cəhd edin.');
    return data && isUsableClub(data) ? normalizeClub(data) : null;
  }, REQUEST_TIMEOUT_MS), force);
}

function isUsableClub(club: Club) {
  return Boolean(club && typeof club.id === 'string' && club.id && typeof club.name === 'string' && club.name.trim() && typeof club.slug === 'string' && validClubSlug(club.slug));
}

function publicQueryError(error: unknown, fallback: string) {
  const message = typeof error === 'object' && error && 'message' in error ? String(error.message).toLowerCase() : '';
  if (/fetch|network|offline|dns|connection|internet/.test(message)) {
    return new Error('İnternet bağlantısı yoxdur və ya serverə qoşulmaq mümkün deyil.');
  }
  return new Error(fallback);
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
