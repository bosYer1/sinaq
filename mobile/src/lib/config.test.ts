import { readMobileConfig } from '@/lib/config';

describe('readMobileConfig', () => {
  test('fails closed when configuration is missing', () => {
    expect(() => readMobileConfig({})).toThrow('konfiqurasiyası yoxdur');
  });

  test('accepts explicit publishable client configuration', () => {
    expect(readMobileConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
    })).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'sb_publishable_example',
    });
  });

  test('rejects non-publishable keys', () => {
    expect(() => readMobileConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'forbidden_private_key',
    })).toThrow('konfiqurasiyası yoxdur');
  });
});
