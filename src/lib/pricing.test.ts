import assert from 'node:assert/strict';
import test from 'node:test';
import { getPlatformStartingPrices } from './pricing.ts';

function price(slug: 'pc' | 'playstation', amount: number, unit: string) {
  return {
    id: `${slug}-${amount}-${unit}`,
    club_id: 'club',
    club_type_id: slug,
    price_from: amount,
    price_to: null,
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
