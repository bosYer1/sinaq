export const colors = {
  primary: '#7C5CFC',
  onPrimary: '#FFFFFF',
  primaryDark: '#6545E8',
  primaryTint: '#F0ECFF',
  playstation: '#06AED4',
  playstationTint: '#E6F8FC',
  background: '#F7F8FC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F8',
  ink: '#1F2330',
  muted: '#697080',
  faint: '#98A0B2',
  border: '#E3E6EE',
  success: '#16875B',
  successTint: '#EAF8F2',
  warning: '#9A6700',
  warningTint: '#FFF7DF',
  danger: '#C0392B',
} as const;

export type ColorPalette = { [Key in keyof typeof colors]: string };
export type ThemeMode = 'system' | 'light' | 'dark';

export const darkColors: ColorPalette = {
  onPrimary: '#16121F',
  primary: '#9A82FF', primaryDark: '#8468FF', primaryTint: '#26213D',
  playstation: '#35C5E5', playstationTint: '#102E36',
  background: '#0B0D12', surface: '#141820', surfaceAlt: '#1C222D',
  ink: '#F3F5F7', muted: '#A5ADBA', faint: '#929DB1', border: '#29313D',
  success: '#4ADE80', successTint: '#123322',
  warning: '#E6B94A', warningTint: '#352B13', danger: '#FF8F86',
};

export function resolveTheme(mode: ThemeMode, system: 'light' | 'dark' | 'unspecified' | null | undefined) {
  return mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;
