import { readMobileConfig } from '@/lib/config';

describe('readMobileConfig', () => {
  test('fails closed when configuration is missing', () => {
    expect(() => readMobileConfig({})).toThrow('konfiqurasiyası yoxdur');
  });

  test('accepts explicit publishable client configuration', () => {
    expect(readMobileConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example_public_key',
    })).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'sb_publishable_example_public_key',
    });
  });

  test('rejects non-publishable keys', () => {
    expect(() => readMobileConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'forbidden_private_key',
    })).toThrow('konfiqurasiyası yoxdur');
  });

  test('rejects malformed endpoints and incomplete publishable keys', () => {
    expect(() => readMobileConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://user@example.supabase.co/path?key=value',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example_public_key',
    })).toThrow('konfiqurasiyası yoxdur');
    expect(() => readMobileConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_',
    })).toThrow('konfiqurasiyası yoxdur');
  });

  test('allows legacy anon JWT but rejects legacy service-role JWT', () => {
    const jwt = (role: string) => `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.signature`;
    expect(readMobileConfig({ EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt('anon') }).supabasePublishableKey).toBe(jwt('anon'));
    expect(() => readMobileConfig({ EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt('service_role') })).toThrow('konfiqurasiyası yoxdur');
  });
});
