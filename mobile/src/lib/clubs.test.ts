import { cheapestPrice, clubsWithCoordinates, filterClubs, normalizeClub, validClubSlug } from '@/lib/clubs';
import type { Club } from '@/types/club';

const CLUB: Club = {
  id: '1', name: 'Arena Gaming', slug: 'arena-gaming', description: null,
  address: 'Nizami küçəsi 10', latitude: 40.4, longitude: 49.8,
  phone: null, instagram_url: null, is_premium: false, premium_expires_at: null,
  is_verified: true, verified_at: null, updated_at: '2026-08-20',
  district: { id: 'd1', name: 'Bakı', slug: 'baki' },
  type_assignments: [{ club_type: { id: 't1', name: 'PC', slug: 'pc' } }],
  pricing: [], images: [], opening_hours: [],
};

describe('filterClubs', () => {
  test('matches Azerbaijani search across name, district and address', () => {
    expect(filterClubs([CLUB], { query: 'nizami', district: null, type: null, verifiedOnly: false })).toHaveLength(1);
  });

  test('combines district, type and verified filters', () => {
    expect(filterClubs([CLUB], { query: '', district: 'baki', type: 'pc', verifiedOnly: true })).toEqual([CLUB]);
    expect(filterClubs([CLUB], { query: '', district: 'gence', type: 'pc', verifiedOnly: true })).toEqual([]);
  });

  test('excludes invalid coordinates without changing valid club data', () => {
    expect(clubsWithCoordinates([CLUB, { ...CLUB, id: '2', latitude: 95 }])).toEqual([CLUB]);
  });

  test('uses the cheapest positive verified price', () => {
    const club = { ...CLUB, pricing: [
      { id: 'bad', price_from: 0, price_to: null, unit: 'saat', club_type: null },
      { id: 'high', price_from: 8, price_to: null, unit: 'saat', club_type: null },
      { id: 'low', price_from: 5, price_to: null, unit: 'saat', club_type: null },
    ] };
    expect(cheapestPrice(club)?.id).toBe('low');
  });

  test('accepts only bounded public route slugs', () => {
    expect(validClubSlug('arena-gaming-24')).toBe(true);
    expect(validClubSlug('../admin')).toBe(false);
    expect(validClubSlug('javascript:alert')).toBe(false);
  });

  test('normalizes missing relation arrays without inventing data', () => {
    const malformed = { ...CLUB, type_assignments: undefined, pricing: null, images: undefined, opening_hours: null } as unknown as Club;
    expect(normalizeClub(malformed)).toMatchObject({ type_assignments: [], pricing: [], images: [], opening_hours: [] });
  });
});
