import { directionsUrl, instagramUrl, phoneUrl } from '@/lib/actions';

describe('native action URLs', () => {
  test('normalizes valid phone numbers and rejects unsafe values', () => {
    expect(phoneUrl('+994 (50) 123-45-67')).toBe('tel:+994501234567');
    expect(phoneUrl('+994501234567 / +994551234567')).toBe('tel:+994501234567');
    expect(phoneUrl('123')).toBeNull();
  });

  test('allows only HTTPS Instagram hosts', () => {
    expect(instagramUrl('https://www.instagram.com/gameyer/')).toBe('https://www.instagram.com/gameyer/');
    expect(instagramUrl('https://instagram.com.evil.test/gameyer')).toBeNull();
    expect(instagramUrl('https://user@instagram.com/gameyer')).toBeNull();
    expect(instagramUrl('javascript:alert(1)')).toBeNull();
  });

  test('builds directions only for valid coordinates', () => {
    expect(directionsUrl(40.4, 49.8)).toContain('destination=40.4,49.8');
    expect(directionsUrl(100, 49.8)).toBeNull();
  });
});
