import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { ClubImage } from '@/components/ClubImage';
import { cheapestPrice, clubTypeLabels, coverImage } from '@/lib/clubs';
import { formatPrice } from '@/lib/format';
import type { Club } from '@/types/club';
import { openClub } from '@/lib/navigation';

export const ClubCard = memo(function ClubCard({ club }: { club: Club }) {
  const image = coverImage(club);
  const types = clubTypeLabels(club);
  const firstPrice = cheapestPrice(club);

  return (
    <Pressable
      onPress={() => openClub(club.slug)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${club.name} klub detalına bax`}
    >
      <ClubImage key={image ?? 'fallback'} uri={image} name={club.name} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{club.name}</Text>
          {club.is_verified ? <Text style={styles.verified}>✓</Text> : null}
          {club.is_premium ? <Text style={styles.premium}>VIP</Text> : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>{[club.district?.name, ...types].filter(Boolean).join(' · ')}</Text>
        <Text style={styles.address} numberOfLines={2}>{club.address}</Text>
        {firstPrice ? <Text style={styles.price}>{formatPrice(firstPrice)}</Text> : <Text style={styles.missing}>Qiymət göstərilməyib</Text>}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: { flexDirection: 'row', minHeight: 138, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' },
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
