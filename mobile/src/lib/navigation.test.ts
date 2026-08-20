import { resetNavigationGuard, shouldNavigateToClub } from '@/lib/navigation';

describe('club navigation guard', () => {
  beforeEach(resetNavigationGuard);

  test('blocks malformed slugs and rapid duplicate pushes', () => {
    expect(shouldNavigateToClub('../admin', 1000)).toBe(false);
    expect(shouldNavigateToClub('arena-gaming', 1000)).toBe(true);
    expect(shouldNavigateToClub('arena-gaming', 1200)).toBe(false);
    expect(shouldNavigateToClub('arena-gaming', 1800)).toBe(true);
  });

  test('blocks rapid pushes even when a different card is tapped', () => {
    expect(shouldNavigateToClub('arena-gaming', 1000)).toBe(true);
    expect(shouldNavigateToClub('next-club', 1100)).toBe(false);
    expect(shouldNavigateToClub('next-club', 1800)).toBe(true);
  });

  test('allows only one push during a 20-tap hammer test', () => {
    const results = Array.from({ length: 20 }, (_, index) => shouldNavigateToClub(`club-${index}`, 1000 + index * 20));
    expect(results.filter(Boolean)).toHaveLength(1);
  });
});
