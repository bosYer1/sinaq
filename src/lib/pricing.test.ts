import assert from 'node:assert/strict';
import test from 'node:test';
import { getHourlyPriceRange, getPlatformStartingPrices, getStartingPrice } from './pricing.ts';

function price(slug: 'pc' | 'playstation', amount: number, unit: string, priceTo: number | null = null) {
  return {
    id: `${slug}-${amount}-${unit}`,
    club_id: 'club',
    club_type_id: slug,
    price_from: amount,
    price_to: priceTo,
    unit,
    club_type: { id: slug, name: slug, slug },
  };
}

test('starting price ignores accessories and packages', () => {
  const result = getPlatformStartingPrices([
    price('playstation', 1, 'əlavə pult'),
    price('playstation', 1.2, '3 saat paket'),
    price('playstation', 1.5, 'saat'),
    price('playstation', 2, 'saat'),
  ]);

  assert.equal(result.playstation?.price_from, 1.5);
  assert.equal(result.playstation?.unit, 'saat');
});

test('legacy currency-prefixed hourly units stay eligible until data normalization', () => {
  const result = getPlatformStartingPrices([
    price('pc', 2.3, 'AZN/saat'),
    price('pc', 4, 'paket'),
  ]);

  assert.equal(result.pc?.price_from, 2.3);
  assert.equal(result.pc?.unit, 'AZN/saat');
});

test('platform starting price never leaks another platform price', () => {
  const pricing = [
    price('pc', 1.1, 'saat'),
    price('playstation', 1.5, 'saat'),
  ];

  assert.equal(getStartingPrice(pricing, 'pc')?.price_from, 1.1);
  assert.equal(getStartingPrice(pricing, 'playstation')?.price_from, 1.5);
  assert.equal(getStartingPrice([price('playstation', 3, 'saat')], 'pc'), null);
});

test('generic hourly range ignores non-hourly add-ons and packages', () => {
  const range = getHourlyPriceRange([
    price('playstation', 1, 'əlavə pult'),
    price('pc', 1.3, 'saat', 2.5),
    price('playstation', 1.5, 'saat', 6),
    price('playstation', 10, 'gecə paketi'),
  ]);

  assert.deepEqual(range, { min: 1.3, max: 6 });
});
