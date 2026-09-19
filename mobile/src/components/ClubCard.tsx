import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, type ColorPalette } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { ClubImage } from '@/components/ClubImage';
import { cheapestPrice, clubTypeLabels, coverImage, isPremiumActive } from '@/lib/clubs';
import { formatPrice } from '@/lib/format';
import type { Club } from '@/types/club';
import { openClub } from '@/lib/navigation';

export const ClubCard = memo(function ClubCard({ club, compact = false }: { club: Club; compact?: boolean }) {
  const styles = useThemedStyles(createStyles);
  const image = coverImage(club);
  const types = clubTypeLabels(club);
  const firstPrice = cheapestPrice(club);
  const meta = [club.district?.name, ...types].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => openClub(club.slug)}
      style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${club.name}. ${meta}. ${club.is_verified ? 'Təsdiqlənib. ' : ''}${firstPrice ? formatPrice(firstPrice) : 'Qiymət göstərilməyib'}. Klub detalına bax`}
    >
      <ClubImage key={image ?? 'fallback'} uri={image} name={club.name} style={[styles.image, compact && styles.compactImage]} priority="low" />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{club.name}</Text>
          {club.is_verified ? <Text style={styles.verified}>✓</Text> : null}
          {isPremiumActive(club) ? <Text style={styles.premium}>Premium</Text> : null}
        </View>
        <Text style={meta ? styles.meta : styles.missing} numberOfLines={1}>{meta || 'Klub tipi göstərilməyib'}</Text>
        <Text style={club.address ? styles.address : styles.missing} numberOfLines={2}>{club.address || 'Ünvan göstərilməyib'}</Text>
        {firstPrice ? <Text style={styles.price}>{formatPrice(firstPrice)}</Text> : <Text style={styles.missing}>Qiymət göstərilməyib</Text>}
      </View>
    </Pressable>
  );
});

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  card: { flexDirection: 'row', minHeight: 138, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' },
  compact: { flexDirection: 'column' }, compactImage: { width: '100%', height: 150 },
  pressed: { opacity: 0.78 },
  image: { width: 122, minHeight: 138, backgroundColor: colors.surfaceAlt },
  content: { flex: 1, padding: spacing.md, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '800' },
  verified: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  premium: { color: colors.warning, backgroundColor: colors.warningTint, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, fontSize: 10, fontWeight: '900' },
  meta: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  address: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  price: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 'auto' },
  missing: { color: colors.faint, fontSize: 12, marginTop: 'auto' },
});
