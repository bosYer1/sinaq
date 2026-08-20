import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

type Props = {
  title: string;
  message?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function ScreenState({ title, message, loading, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable style={styles.button} onPress={onAction} accessibilityRole="button">
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  title: { color: colors.ink, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 340 },
  button: { minHeight: 48, justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
