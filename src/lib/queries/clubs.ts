import { createClient } from '@/lib/supabase/server';
import type { ClubFilters, ClubWithRelations } from '@/types/database';

/**
 * Supabase-in nested select sintaksisi ilə klubu bütün əlaqəli data ilə
 * (rayon, qiymətlər+tip, şəkillər, iş saatları) tək sorğuda çəkir.
 *
 * Nəticə tipi HƏR YERDƏ .returns<T>() ilə əl ilə təyin olunur.
 */
const CLUB_SELECT = `
  *,
  district:districts ( id, name, slug ),
  pricing:club_pricing (
    id, club_id, club_type_id, price_from, price_to, unit,
    club_type:club_types ( id, name, slug )
  ),
  images:club_images ( id, url, is_cover, position ),
  opening_hours:club_opening_hours ( id, club_id, day_of_week, open_time, close_time, is_closed )
`;

/**
 * Filtrlərə uyğun aktiv klubları qaytarır.
 */
export async function getClubs(filters: ClubFilters = {}): Promise<ClubWithRelations[]> {
  const supabase = createClient();

  if (!supabase) return [];

  let districtId: string | null = null;

  if (filters.district) {
    const { data: districtRow, error: districtError } = await supabase
      .from('districts')
      .select('id')
      .eq('slug', filters.district)
      .maybeSingle()
      .returns<{ id: string }>();

    if (districtError) {
      console.error(
        'getClubs (district lookup) xətası:',
        districtError.message,
      );
      return [];
    }

    if (!districtRow) return [];

    districtId = districtRow.id;
  }

  let clubTypeId: string | null = null;

  if (filters.type) {
    const { data: typeRow, error: typeError } = await supabase
      .from('club_types')
      .select('id')
      .eq('slug', filters.type)
      .maybeSingle()
      .returns<{ id: string }>();

    if (typeError) {
      console.error(
        'getClubs (club_type lookup) xətası:',
        typeError.message,
      );
      return [];
    }

    if (!typeRow) return [];

    clubTypeId = typeRow.id;
  }

  const needsPricingInnerJoin = Boolean(
    clubTypeId || filters.priceMax,
  );

  const selectString = needsPricingInnerJoin
    ? CLUB_SELECT.replace(
        'pricing:club_pricing (',
        'pricing:club_pricing!inner (',
      )
    : CLUB_SELECT;

  let query = supabase
    .from('clubs')
    .select(selectString)
    .eq('is_active', true)
    .order('is_premium', { ascending: false })
    .order('rating_avg', {
      ascending: false,
      nullsFirst: false,
    });

  if (districtId) {
    query = query.eq('district_id', districtId);
  }

  if (clubTypeId) {
    query = query.eq('pricing.club_type_id', clubTypeId);
  }

  if (filters.priceMax) {
    query = query.lte(
      'pricing.price_from',
      filters.priceMax,
    );
  }

  // Klub adı, ünvan və slug üzrə axtarış.
  const searchQuery = filters.q?.trim();

  if (searchQuery) {
    const sanitized = searchQuery
      .replace(/[%_,()]/g, ' ')
      .trim();

    if (sanitized) {
      query = query.or(
        `name.ilike.%${sanitized}%,address.ilike.%${sanitized}%,slug.ilike.%${sanitized}%`,
      );
    }
  }

  const { data, error } =
    await query.returns<ClubWithRelations[]>();

  if (error) {
    console.error('getClubs xətası:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Tək klubu slug-a görə bütün detallarla qaytarır.
 */
export async function getClubBySlug(
  slug: string,
): Promise<ClubWithRelations | null> {
  const supabase = createClient();

  if (!supabase) return null;

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
