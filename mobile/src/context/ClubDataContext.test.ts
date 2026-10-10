import { reconcileFilters } from '@/context/ClubDataContext';
import type { Club, ClubFilters } from '@/types/club';

const filters: ClubFilters = { query: 'arena', district: 'baki', type: 'pc', verifiedOnly: true };
const club = {
  district: { id: 'district', name: 'Bakı', slug: 'baki' },
  type_assignments: [{ club_type: { id: 'type', name: 'PC', slug: 'pc' } }],
} as Club;

describe('club filter reconciliation', () => {
  test('preserves valid filters after refresh', () => {
    expect(reconcileFilters(filters, [club])).toBe(filters);
  });

  test('clears only relation filters that disappeared after refresh', () => {
    expect(reconcileFilters(filters, [{ ...club, district: null, type_assignments: [] }])).toEqual({
      query: 'arena',
      district: null,
      type: null,
      verifiedOnly: true,
    });
  });
});
