import { isNativeMapConfigured } from '@/lib/features';

describe('native feature availability', () => {
  test('keeps the map unavailable unless the native build explicitly enables it', () => {
    expect(isNativeMapConfigured()).toBe(false);
    expect(isNativeMapConfigured({})).toBe(false);
    expect(isNativeMapConfigured({ nativeMapEnabled: false })).toBe(false);
    expect(isNativeMapConfigured({ nativeMapEnabled: 'true' })).toBe(false);
  });

  test('enables the map only for an explicitly configured native build', () => {
    expect(isNativeMapConfigured({ nativeMapEnabled: true })).toBe(true);
  });
});
