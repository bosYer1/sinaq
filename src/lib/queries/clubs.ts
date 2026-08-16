import { createClient } from '@/lib/supabase/server';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { isPremiumActive } from '@/lib/utils';
import type { ClubFilters, ClubWithRelations } from '@/types/database';

const CLUB_SELECT = `
  *,
  district:districts ( id, name, slug ),
  type_assignments:club_type_assignments (
    club_type_id,
    club_type:club_types ( id, name, slug )
  ),
  pricing:club_pricing (
    id, club_id, club_type_id, price_from, price_to, unit,
    club_type:club_types ( id, name, slug )
  ),
  images:club_images ( id, url, is_cover, position ),
  opening_hours:club_opening_hours ( id, club_id, day_of_week, open_time, close_time, is_closed )
`;

function normalizeClubRelations(club: ClubWithRelations): ClubWithRelations {
  return {
    ...club,
    // Rating snapshots come from external business/map sources. Keep them out of
    // public UI and structured data until GameYer has first-party reviews.
    rating_avg: null,
    rating_count: 0,
    type_assignments: Array.isArray(club.type_assignments) ? club.type_assignments : [],
    pricing: Array.isArray(club.pricing) ? club.pricing : [],
    images: Array.isArray(club.images) ? club.images : [],
    opening_hours: Array.isArray(club.opening_hours) ? club.opening_hours : [],
  };
}

export async function getClubs(filters: ClubFilters = {}): Promise<ClubWithRelations[]> {
  const supabase = await createClient();
  let districtId: string | null = null;

  if (filters.district) {
    const { data: districtRow, error: districtError } = await supabase
      .from('districts')
      .select('id')
      .eq('slug', filters.district)
      .maybeSingle()
      .returns<{ id: string }>();

    if (districtError) {
      console.error('getClubs (district lookup) xətası:', districtError.message);
      return [];
    }

    if (!districtRow) return [];
    districtId = districtRow.id;
  }

  const hasPriceFilter = filters.priceMax != null && filters.priceMax > 0;
  const selectString = hasPriceFilter
    ? CLUB_SELECT.replace('pricing:club_pricing (', 'pricing:club_pricing!inner (')
    : CLUB_SELECT;

  let query = supabase
    .from('clubs')
    .select(selectString)
    .eq('is_active', true)
    .order('is_premium', { ascending: false })
    .order('name', { ascending: true });

  if (districtId) query = query.eq('district_id', districtId);

  if (hasPriceFilter) {
    query = query
      .gt('pricing.price_from', 0)
      .lte('pricing.price_from', filters.priceMax!);
  }

  const searchQuery = filters.q?.trim();
  if (searchQuery) {
    const sanitized = searchQuery.replace(/[%_,()]/g, ' ').trim();
    if (sanitized) {
      query = query.or(
        `name.ilike.%${sanitized}%,address.ilike.%${sanitized}%,slug.ilike.%${sanitized}%`
      );
    }
  }

  const { data, error } = await query.returns<ClubWithRelations[]>();
  if (error) {
    console.error('getClubs xətası:', error.message);
    return [];
  }

  let clubs = (data ?? []).map(normalizeClubRelations);
  const requestedType = filters.type === 'ps' ? 'playstation' : filters.type;
  const hasTypeFilter = requestedType === 'pc' || requestedType === 'playstation';

  if (hasTypeFilter) {
    clubs = clubs.filter((club) => inferClubTypeSlugs(club).includes(requestedType));
  }

  if (hasPriceFilter && hasTypeFilter) {
    clubs = clubs.filter((club) =>
      club.pricing.some(
        (pricing) =>
          pricing.club_type?.slug === requestedType &&
          pricing.price_from > 0 &&
          pricing.price_from <= filters.priceMax!
      )
    );
  }

  clubs = [...clubs].sort((a, b) => {
    const premiumDelta = Number(isPremiumActive(b)) - Number(isPremiumActive(a));
    if (premiumDelta !== 0) return premiumDelta;
    return a.name.localeCompare(b.name, 'az');
  });

  return clubs;
}

export async function getClubBySlug(slug: string): Promise<ClubWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clubs')
    .select(CLUB_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
    .returns<ClubWithRelations>();

  if (error) {
    console.error('getClubBySlug xətası:', error.message);
    return null;
  }

  return data ? normalizeClubRelations(data) : null;
}
