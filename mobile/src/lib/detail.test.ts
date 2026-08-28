import { detailImages } from './detail';
import { formatHours, formatPrice } from './format';

test('original profile image leads the gallery without duplication', () => {
  expect(detailImages({ profile_image_url: 'https://example.com/profile.jpg', images: [
    { id: 'p', url: 'https://example.com/profile.jpg', is_cover: false, position: 1 },
    { id: 'g', url: 'https://example.com/gallery.jpg', is_cover: true, position: 0 },
  ] }).map(({ id }) => id)).toEqual(['profile', 'g']);
});
test('missing images and hours do not become fabricated values', () => {
  expect(detailImages({ profile_image_url: null, images: [] })).toEqual([]);
  expect(formatHours({ id: '1', day_of_week: 0, open_time: null, close_time: null, is_closed: false })).toBe('Bazar ertəsi: saat göstərilməyib');
});
test('price retains tariff, schedule and decimals', () => {
  expect(formatPrice({ id: 'p', price_from: 2.5, price_to: null, unit: 'saat', tariff_name: 'PC', schedule_label: 'Həftə içi', club_type: null })).toBe('PC · Həftə içi: 2.5 ₼/saat');
});
