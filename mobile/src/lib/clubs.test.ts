import { filterClubs } from '@/lib/clubs';
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
});
