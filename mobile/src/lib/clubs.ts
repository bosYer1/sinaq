import type { Club, ClubFilters } from '@/types/club';
import { getSupabaseClient } from '@/lib/supabase';

const CLUB_SELECT = `
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

export async function fetchClubs(): Promise<Club[]> {
  const { data, error } = await getSupabaseClient()
    .from('clubs')
    .select(CLUB_SELECT)
    .eq('is_active', true)
    .order('is_premium', { ascending: false })
    .order('name', { ascending: true })
    .returns<Club[]>();

  if (error) throw new Error(`Klub məlumatları alınmadı: ${error.message}`);

  return (data ?? []).map((club) => ({
    ...club,
    type_assignments: Array.isArray(club.type_assignments) ? club.type_assignments : [],
    pricing: Array.isArray(club.pricing) ? club.pricing : [],
    images: Array.isArray(club.images)
      ? [...club.images].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position)
      : [],
    opening_hours: Array.isArray(club.opening_hours)
      ? [...club.opening_hours].sort((a, b) => a.day_of_week - b.day_of_week)
      : [],
  }));
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

export function clubTypeLabels(club: Club) {
  return club.type_assignments
    .map((assignment) => assignment.club_type?.name)
    .filter((name): name is string => Boolean(name));
}

export function coverImage(club: Club) {
  return club.images[0]?.url ?? null;
}
