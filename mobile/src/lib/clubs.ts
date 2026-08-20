import type { Club, ClubFilters } from '@/types/club';
import { getSupabaseClient } from '@/lib/supabase';

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

function normalizeClub(club: Club): Club {
  return {
    ...club,
    description: club.description ?? null,
    phone: club.phone ?? null,
    instagram_url: club.instagram_url ?? null,
    verified_at: club.verified_at ?? null,
    type_assignments: Array.isArray(club.type_assignments) ? club.type_assignments : [],
    pricing: Array.isArray(club.pricing) ? club.pricing : [],
    images: Array.isArray(club.images) ? [...club.images].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position) : [],
    opening_hours: Array.isArray(club.opening_hours) ? [...club.opening_hours].filter((hours) => hours.day_of_week >= 0 && hours.day_of_week <= 6).sort((a, b) => a.day_of_week - b.day_of_week) : [],
  };
}

export async function fetchClubs(): Promise<Club[]> {
  const { data, error } = await getSupabaseClient()
    .from('clubs')
    .select(LIST_SELECT)
    .eq('is_active', true)
    .order('is_premium', { ascending: false })
    .order('name', { ascending: true })
    .returns<Club[]>();

  if (error) throw new Error(`Klub məlumatları alınmadı: ${error.message}`);

  return (data ?? []).map(normalizeClub);
}

export function validClubSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 120;
}

export async function fetchClubBySlug(slug: string): Promise<Club | null> {
  if (!validClubSlug(slug)) return null;
  const { data, error } = await getSupabaseClient().from('clubs').select(DETAIL_SELECT).eq('slug', slug).eq('is_active', true).maybeSingle().returns<Club>();
  if (error) throw new Error(`Klub məlumatı alınmadı: ${error.message}`);
  return data ? normalizeClub(data) : null;
}

export function filterClubs(clubs: Club[], filters: ClubFilters) {
  const query = filters.query.trim().toLocaleLowerCase('az');

  return clubs.filter((club) => {
    if (filters.verifiedOnly && !club.is_verified) return false;
    if (filters.district && club.district?.slug !== filters.district) return false;
    if (
      filters.type &&
      !club.type_assignments.some((assignment) => assignment.club_type?.slug === filters.type)
    ) return false;
    if (!query) return true;

    return [club.name, club.address, club.district?.name]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase('az').includes(query));
  });
}

export function clubsWithCoordinates(clubs: Club[]) {
  return clubs.filter((club) => (
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
