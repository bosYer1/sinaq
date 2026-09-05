import { formatDistance, haversineKm, sortByDistance, validPosition } from './distance';
import type { Club } from '@/types/club';

test('Haversine handles zero, known equatorial distance and antipodes', () => {
  const origin = { latitude: 0, longitude: 0 };
  expect(haversineKm(origin, origin)).toBe(0);
  expect(haversineKm(origin, { latitude: 0, longitude: 1 })).toBeCloseTo(111.195, 2);
  expect(haversineKm(origin, { latitude: 0, longitude: 180 })).toBeCloseTo(20015.114, 2);
});
test('rejects missing, string and non-finite coordinates but accepts zero', () => {
  for (const latitude of [null, undefined, '40.4', Number.NaN, Infinity, 91]) expect(validPosition({ latitude, longitude: 49.8 })).toBe(false);
  expect(validPosition({ latitude: 0, longitude: 0 })).toBe(true);
});
test('sorts valid clubs by distance without mutating source; invalid origin produces no results', () => {
  const clubs = [
    { id: 'far', name: 'Far', latitude: 1, longitude: 0 },
    { id: 'missing', name: 'Missing', latitude: null, longitude: 0 },
    { id: 'near', name: 'Near', latitude: 0.1, longitude: 0 },
  ] as Club[];
  expect(sortByDistance(clubs, { latitude: 0, longitude: 0 }).map(({ club }) => club.id)).toEqual(['near', 'far']);
  expect(clubs[0].id).toBe('far');
  expect(sortByDistance(clubs, { latitude: Number.NaN, longitude: 0 })).toEqual([]);
});
test('distance text does not imply zero precision or display NaN', () => {
  expect(formatDistance(1.23)).toBe('1.2 km');
  expect(formatDistance(0)).toBe('<0.1 km');
  expect(formatDistance(Number.NaN)).toBe('Məsafə məlum deyil');
});
