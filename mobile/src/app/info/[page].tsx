import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { ScreenState } from '@/components/ScreenState';
import { spacing, type ColorPalette } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { infoPage } from '@/lib/info';
import { openExternalUrl } from '@/lib/openExternal';

export default function InfoScreen() {
  const styles = useThemedStyles(createStyles);
  const { page } = useLocalSearchParams<{ page?: string | string[] }>();
  const content = infoPage(typeof page === 'string' ? page : undefined);
  if (!content) return <ScreenState title="Səhifə tapılmadı" />;
  return <ScrollView contentContainerStyle={styles.content}>
    <Stack.Screen options={{ title: content.title }} />
    <Text style={styles.title} accessibilityRole="header">{content.title}</Text>
    <Text style={styles.body}>{content.body}</Text>
    {content.url ? <Pressable style={styles.button} accessibilityRole="link" onPress={() => void openExternalUrl(content.url!)}><Text style={styles.buttonText}>{content.action}</Text></Pressable> : null}
  </ScrollView>;
}
const createStyles = (colors: ColorPalette) => StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.xl, backgroundColor: colors.background, gap: spacing.lg },
  title: { color: colors.ink, fontSize: 26, fontWeight: '800' }, body: { color: colors.muted, fontSize: 16, lineHeight: 26 },
  button: { minHeight: 48, padding: spacing.lg, borderRadius: 12, backgroundColor: colors.primary },
  buttonText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
});
