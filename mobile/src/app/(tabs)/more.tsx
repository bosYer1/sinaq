import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { spacing, type ColorPalette } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { INFO_PAGES } from '@/lib/info';

export default function MoreScreen() {
  const styles = useThemedStyles(createStyles);
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Daha çox</Text>
    <Pressable style={styles.row} accessibilityRole="button" onPress={() => router.push('/appearance')}><Text style={styles.label}>Görünüş / theme</Text></Pressable>
    {Object.entries(INFO_PAGES).map(([page, content]) => <Pressable key={page} style={styles.row} accessibilityRole="button" onPress={() => router.push({ pathname: '/info/[page]', params: { page } })}><Text style={styles.label}>{content.title}</Text></Pressable>)}
    <Text style={styles.version}>App versiyası: {Constants.expoConfig?.version ?? 'Məlum deyil'} · Beta</Text>
  </ScrollView>;
}
const createStyles = (colors: ColorPalette) => StyleSheet.create({
  content: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.ink, fontSize: 26, fontWeight: '800' },
  row: { minHeight: 52, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, justifyContent: 'center' },
  label: { color: colors.ink, fontSize: 16 }, version: { color: colors.muted, fontSize: 14, marginTop: spacing.md },
});
