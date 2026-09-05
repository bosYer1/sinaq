import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { radius, spacing, type ColorPalette, type ThemeMode } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';

const options: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'Sistemə uyğun' },
  { mode: 'light', label: 'İşıqlı' },
  { mode: 'dark', label: 'Qaranlıq' },
];

export default function AppearanceScreen() {
  const { mode, setMode } = useTheme();
  const styles = useThemedStyles(createStyles);
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Görünüş</Text>
    <Text style={styles.description}>Sistem seçimi telefonunuzun görünüşünü izləyir. Seçim bu sessiya üçün tətbiq olunur.</Text>
    {options.map((option) => <Pressable
      key={option.mode}
      onPress={() => setMode(option.mode)}
      accessibilityRole="radio"
      accessibilityState={{ checked: mode === option.mode }}
      style={[styles.option, mode === option.mode && styles.selected]}
    >
      <Text style={styles.label}>{option.label}{mode === option.mode ? ' ✓' : ''}</Text>
    </Pressable>)}
  </ScrollView>;
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  content: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md },
  title: { color: colors.ink, fontSize: 26, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 15, lineHeight: 23, marginBottom: spacing.md },
  option: { minHeight: 52, justifyContent: 'center', padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  selected: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  label: { color: colors.ink, fontSize: 16, fontWeight: '700' },
});
