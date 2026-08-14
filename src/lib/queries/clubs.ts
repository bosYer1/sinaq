import { createClient } from '@/lib/supabase/server';
import { inferClubTypeSlugs } from '@/lib/clubType';
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

export async function getClubs(filters: ClubFilters = {}): Promise<ClubWithRelations[]> {
  const supabase = createClient();
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
    .order('rating_avg', { ascending: false, nullsFirst: false });

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

  let clubs = data ?? [];
  const requestedType = filters.type === 'ps' ? 'playstation' : filters.type;
  const hasTypeFilter = requestedType === 'pc' || requestedType === 'playstation';

  if (hasTypeFilter) {
    clubs = clubs.filter((club) => inferClubTypeSlugs(club).includes(requestedType));
  }

  if (hasPriceFilter && hasTypeFilter) {
    clubs = clubs.filter((club) =>
      club.pricing.some(
        (pricing) =>
          pricing.club_type.slug === requestedType &&
          pricing.price_from > 0 &&
          pricing.price_from <= filters.priceMax!
      )
    );
  }

  return clubs;
}

export async function getClubBySlug(slug: string): Promise<ClubWithRelations | null> {
  const supabase = createClient();

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

  return data;
}
