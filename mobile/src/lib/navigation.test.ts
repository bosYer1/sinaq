import { resetNavigationGuard, shouldNavigateToClub } from '@/lib/navigation';

describe('club navigation guard', () => {
  beforeEach(resetNavigationGuard);

  test('blocks malformed slugs and rapid duplicate pushes', () => {
    expect(shouldNavigateToClub('../admin', 1000)).toBe(false);
    expect(shouldNavigateToClub('arena-gaming', 1000)).toBe(true);
    expect(shouldNavigateToClub('arena-gaming', 1200)).toBe(false);
    expect(shouldNavigateToClub('arena-gaming', 1800)).toBe(true);
  });

  test('allows rapid selection of a different club', () => {
    expect(shouldNavigateToClub('arena-gaming', 1000)).toBe(true);
    expect(shouldNavigateToClub('next-club', 1100)).toBe(true);
  });
});
