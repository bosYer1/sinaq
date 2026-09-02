import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function isNativeMapConfigured(
  extra: Record<string, unknown> | undefined = Constants.expoConfig?.extra,
  platform = Platform.OS,
) {
  // Apple Maps is available in an iOS native binary without a Google Maps key.
  return platform === 'ios' || extra?.nativeMapEnabled === true;
}
