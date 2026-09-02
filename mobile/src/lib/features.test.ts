import { isNativeMapConfigured } from '@/lib/features';

describe('native feature availability', () => {
  test('keeps Android map unavailable unless the native build explicitly enables it', () => {
    expect(isNativeMapConfigured(undefined, 'android')).toBe(false);
    expect(isNativeMapConfigured({}, 'android')).toBe(false);
    expect(isNativeMapConfigured({ nativeMapEnabled: false }, 'android')).toBe(false);
    expect(isNativeMapConfigured({ nativeMapEnabled: 'true' }, 'android')).toBe(false);
  });

  test('enables configured Android maps and keyless Apple Maps on iOS', () => {
    expect(isNativeMapConfigured({ nativeMapEnabled: true }, 'android')).toBe(true);
    expect(isNativeMapConfigured({ nativeMapEnabled: false }, 'ios')).toBe(true);
  });
});
