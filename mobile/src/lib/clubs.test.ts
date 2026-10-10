import { cheapestPrice, cleanSearchQuery, clubsWithCoordinates, coverImage, filterClubs, isPremiumActive, isPublicClub, normalizeClub, normalizeClubList, normalizeRemoteImageUrl, validClubSlug } from '@/lib/clubs';
import type { Club } from '@/types/club';

const CLUB: Club = {
  id: '1', name: 'Arena Gaming', slug: 'arena-gaming', description: null,
  address: 'Nizami küçəsi 10', latitude: 40.4, longitude: 49.8,
  phone: null, instagram_url: 'https://www.instagram.com/arena/', profile_image_url: null, is_active: true, is_premium: false, premium_expires_at: null,
  is_verified: true, verified_at: null, updated_at: '2026-08-20',
  district: { id: 'd1', name: 'Bakı', slug: 'baki' },
  type_assignments: [{ club_type: { id: 't1', name: 'PC', slug: 'pc' } }],
  pricing: [], images: [], opening_hours: [],
};

describe('filterClubs', () => {
  test('public eligibility matches active Instagram coordinate and assigned-type requirements', () => {
    expect(isPublicClub(CLUB)).toBe(true);
    for (const changes of [
      { is_active: false }, { instagram_url: null }, { instagram_url: ' ' },
      { latitude: null }, { longitude: null }, { type_assignments: [] },
    ]) {
      expect(isPublicClub({ ...CLUB, ...changes })).toBe(false);
      expect(normalizeClubList([{ ...CLUB, ...changes }])).toEqual([]);
    }
  });

  test('prefers the real profile image and preserves tariff context', () => {
    const profile = 'https://example.supabase.co/storage/v1/object/public/club-images/logo.png';
    const club = normalizeClub({ ...CLUB, profile_image_url: profile, pricing: [
      { id: 'p', price_from: 2.5, price_to: null, unit: 'saat', tariff_name: 'VIP PC', schedule_label: 'Həftə içi', position: 1, club_type: null },
    ] });
    expect(coverImage(club)).toBe(profile);
    expect(club.pricing[0]).toMatchObject({ price_from: 2.5, tariff_name: 'VIP PC', schedule_label: 'Həftə içi' });
  });
  test('matches web premium expiry rules and sorts active premium first', () => {
    const now = Date.parse('2026-08-28T00:00:00Z');
    expect(isPremiumActive({ is_premium: true, premium_expires_at: null }, now)).toBe(false);
    expect(isPremiumActive({ is_premium: true, premium_expires_at: 'invalid' }, now)).toBe(false);
    expect(isPremiumActive({ is_premium: true, premium_expires_at: '2026-08-27' }, now)).toBe(false);
    expect(isPremiumActive({ is_premium: true, premium_expires_at: '2026-08-29' }, now)).toBe(true);
    const premium = { ...CLUB, id: 'premium', name: 'Z Club', is_premium: true, premium_expires_at: '2099-01-01' };
    expect(normalizeClubList([CLUB, premium]).map((club) => club.id)).toEqual(['premium', CLUB.id]);
  });

  test('matches web type filters using pricing and conservative text fallback', () => {
    const filters = { query: '', district: null, type: 'playstation', verifiedOnly: false };
    const legacy = { ...CLUB, type_assignments: [], pricing: [{ id: 'p', price_from: 5, price_to: null, unit: 'saat', club_type: { id: 'ps', name: 'PS', slug: 'ps' } }] };
    expect(filterClubs([legacy], filters)).toEqual([legacy]);
    const described = { ...CLUB, type_assignments: [], description: 'PlayStation klub' };
    expect(filterClubs([described], filters)).toEqual([described]);
    expect(filterClubs([{ ...described, description: 'gaming' }], filters)).toEqual([]);
  });
  test('matches Azerbaijani search across name, district and address', () => {
    expect(filterClubs([CLUB], { query: 'nizami', district: null, type: null, verifiedOnly: false })).toHaveLength(1);
    expect(filterClubs([{ ...CLUB, name: 'İnternet Klub' }], { query: 'internet', district: null, type: null, verifiedOnly: false })).toHaveLength(1);
  });

  test('normalizes Unicode and repeated whitespace in search input', () => {
    const club = { ...CLUB, name: 'Əla   Arena' };
    expect(filterClubs([club], { query: '  Əla Arena  ', district: null, type: null, verifiedOnly: false })).toEqual([club]);
    expect(cleanSearchQuery('  Əla   Arena  ')).toBe('Əla Arena');
  });

  test('keeps rapid Azerbaijani search updates deterministic', () => {
    const clubs = [{ ...CLUB, name: 'Əyləncə üçün Işıqlı Ödənişsiz Üzvlük Çeşidi və Yağış' }];
    for (const query of ['ə', 'ı', 'ö', 'ü', 'ş', 'ç', 'ğ', 'mövcud deyil', 'yağış']) {
      const result = filterClubs(clubs, { query, district: null, type: null, verifiedOnly: false });
      expect(result).toHaveLength(query === 'mövcud deyil' ? 0 : 1);
    }
  });

  test('combines district, type and verified filters', () => {
    expect(filterClubs([CLUB], { query: '', district: 'baki', type: 'pc', verifiedOnly: true })).toEqual([CLUB]);
    expect(filterClubs([CLUB], { query: '', district: 'gence', type: 'pc', verifiedOnly: true })).toEqual([]);
  });

  test('excludes invalid coordinates without changing valid club data', () => {
    expect(clubsWithCoordinates([CLUB, { ...CLUB, id: '2', latitude: 95 }])).toEqual([CLUB]);
    expect(clubsWithCoordinates([{ ...CLUB, latitude: null, longitude: null }])).toEqual([]);
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

  test('drops malformed list payloads and blank identifiers', () => {
    expect(normalizeClubList(null)).toEqual([]);
    expect(normalizeClubList([{ ...CLUB, id: '   ' }, CLUB])).toEqual([CLUB]);
  });

  test('drops malformed relations and unsafe remote images', () => {
    const malformed = {
      ...CLUB,
      images: [
        { id: 'ok', url: 'https://cdn.example.com/club.jpg', is_cover: true, position: 0 },
        { id: 'http', url: 'http://cdn.example.com/club.jpg', is_cover: false, position: 1 },
        { id: 'credentials', url: 'https://user:pass@cdn.example.com/club.jpg', is_cover: false, position: 2 },
      ],
      pricing: [{ id: 'bad', price_from: Number.NaN, price_to: null, unit: 'saat', club_type: null }],
    };
    expect(normalizeClub(malformed).images.map((image) => image.id)).toEqual(['ok']);
    expect(normalizeClub(malformed).pricing).toEqual([]);
  });

  test('trims safe remote image URLs before rendering them', () => {
    const normalized = normalizeClub({
      ...CLUB,
      profile_image_url: '  https://cdn.example.com/profile.jpg  ',
      images: [{ id: 'image', url: ' https://cdn.example.com/club.jpg ', is_cover: true, position: 0 }],
    });
    expect(normalized.profile_image_url).toBe('https://cdn.example.com/profile.jpg');
    expect(normalized.images[0].url).toBe('https://cdn.example.com/club.jpg');
    expect(normalizeRemoteImageUrl('javascript:alert(1)')).toBeNull();
  });

  test('deduplicates relations and rejects invalid prices and hours', () => {
    const malformed = {
      ...CLUB,
      type_assignments: [CLUB.type_assignments[0], CLUB.type_assignments[0], { club_type: { id: '', name: 'Bad', slug: '../bad' } }],
      pricing: [
        { id: 'price', price_from: 5, price_to: 4, unit: 'saat', club_type: null },
        { id: 'valid', price_from: 5, price_to: 8, unit: 'saat', club_type: null },
        { id: 'valid', price_from: 5, price_to: 8, unit: 'saat', club_type: null },
      ],
      opening_hours: [
        { id: 'bad', day_of_week: 0, open_time: '99:00', close_time: '18:00', is_closed: false },
        { id: 'monday', day_of_week: 0, open_time: '09:00', close_time: '18:00', is_closed: false },
        { id: 'duplicate-day', day_of_week: 0, open_time: '10:00', close_time: '19:00', is_closed: false },
      ],
    } as unknown as Club;
    const normalized = normalizeClub(malformed);
    expect(normalized.type_assignments).toHaveLength(1);
    expect(normalized.pricing.map((price) => price.id)).toEqual(['valid']);
    expect(normalized.opening_hours.map((hours) => hours.id)).toEqual(['monday']);
  });
});
