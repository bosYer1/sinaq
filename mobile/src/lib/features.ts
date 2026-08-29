import Constants from 'expo-constants';

export function isNativeMapConfigured(extra: Record<string, unknown> | undefined = Constants.expoConfig?.extra) {
  return extra?.nativeMapEnabled === true;
}
