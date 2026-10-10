import { colors, darkColors, resolveTheme } from './theme';

describe('native theme resolution', () => {
  test('follows system changes with a safe light fallback', () => {
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('system', 'light')).toBe('light');
    expect(resolveTheme('system', null)).toBe('light');
    expect(resolveTheme('system', 'unspecified')).toBe('light');
  });

  test('manual choice overrides the system and both palettes have every token', () => {
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(colors).sort());
    expect(darkColors.background).not.toBe(colors.background);
  });
});
