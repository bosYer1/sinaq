import { describe, expect, it } from 'vitest';
import { getPlatformStartingPrices, isHourlyPricing } from './pricing';

describe('pricing helpers', () => {
  it('keeps PC and PlayStation hourly starting prices separate', () => {
    const pricing = [
      { price_from: 1.2, unit: 'saat', club_type: { slug: 'pc' } },
      { price_from: 7, unit: '6 saat paket', club_type: { slug: 'pc' } },
      { price_from: 2.5, unit: 'saat', club_type: { slug: 'playstation' } },
    ];

    expect(getPlatformStartingPrices(pricing)).toEqual({ pc: 1.2, playstation: 2.5 });
  });

  it('does not treat package prices as hourly prices', () => {
    expect(isHourlyPricing({ unit: 'saat' })).toBe(true);
    expect(isHourlyPricing({ unit: '6 saat paket' })).toBe(false);
    expect(isHourlyPricing({ unit: 'gecə paketi' })).toBe(false);
  });
});
