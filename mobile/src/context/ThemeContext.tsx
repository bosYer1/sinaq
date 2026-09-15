import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { colors, darkColors, resolveTheme, type ColorPalette, type ThemeMode } from '@/constants/theme';

type ThemeValue = {
  colors: ColorPalette;
  mode: ThemeMode;
  scheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const scheme = resolveTheme(mode, system);
  const palette = scheme === 'dark' ? darkColors : colors;

  useEffect(() => {
    // System UI is cosmetic; failure must not prevent discovery from opening.
    void SystemUI.setBackgroundColorAsync(palette.background).catch(() => {});
  }, [palette]);

  const value = useMemo(() => ({ colors: palette, mode, scheme, setMode }), [mode, palette, scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('ThemeProvider tələb olunur.');
  return theme;
}

export function useThemedStyles<T>(createStyles: (palette: ColorPalette) => T): T {
  const { colors: palette } = useTheme();
  return useMemo(() => createStyles(palette), [createStyles, palette]);
}
