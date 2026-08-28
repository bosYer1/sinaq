import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClubMap } from '@/components/ClubMap';
import { ScreenState } from '@/components/ScreenState';
import { radius, spacing, type ColorPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useClubData } from '@/context/ClubDataContext';
import { cheapestPrice, clubsWithCoordinates, clubTypeLabels } from '@/lib/clubs';
import { formatPrice } from '@/lib/format';
import type { Club } from '@/types/club';
import { openClub } from '@/lib/navigation';

export default function MapScreen() {
  const styles = useThemedStyles(createStyles);
  const { filteredClubs, loading, error, reload } = useClubData();
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const mapped = useMemo(() => clubsWithCoordinates(filteredClubs), [filteredClubs]);
  const selected = mapped.find((club) => club.id === selectedClubId) ?? null;
  const selectClub = useCallback((club: Club) => setSelectedClubId(club.id), []);
  const clearSelection = useCallback(() => setSelectedClubId(null), []);

  useFocusEffect(useCallback(() => {
    setSelectedClubId(null);
  }, []));

  if (loading) return <ScreenState loading title="Xəritə hazırlanır" />;
  if (error && mapped.length === 0) return <ScreenState title="Xəritə məlumatı alınmadı" message={error} actionLabel="Yenidən yoxla" onAction={() => void reload()} />;
  if (mapped.length === 0) return <ScreenState title="Xəritədə klub tapılmadı" message="Seçilmiş filtrlərdə koordinatı təsdiqlənmiş klub yoxdur." />;
  const withoutCoordinates = filteredClubs.length - mapped.length;

  return <View style={styles.container}>
    <AppErrorBoundary title="Xəritə göstərilə bilmədi" message="Klub siyahısı işləməyə davam edir. Xəritəni yenidən aça bilərsiniz." actionLabel="Xəritəni yenidən aç" onReset={clearSelection}>
      <ClubMap clubs={mapped} selectedClubId={selected?.id ?? null} onSelectClub={selectClub} onClearSelection={clearSelection} />
      <View style={styles.counter} pointerEvents="none"><Text style={styles.counterText}>{mapped.length} klub xəritədə</Text>{withoutCoordinates > 0 ? <Text style={styles.counterSubtext}>{withoutCoordinates} klubun koordinatı yoxdur</Text> : null}</View>
      {selected ? <MapClubCard club={selected} /> : null}
    </AppErrorBoundary>
  </View>;
}

function MapClubCard({ club }: { club: Club }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const price = cheapestPrice(club);
  const meta = [club.district?.name, ...clubTypeLabels(club)].filter(Boolean).join(' · ');
  return <Pressable style={({ pressed }) => [styles.clubCard, pressed && styles.pressed]} onPress={() => openClub(club.slug)} accessibilityRole="button" accessibilityLabel={`${club.name} klub detalına bax`}>
    <View style={styles.cardBody}><View style={styles.cardTitleRow}><Text style={styles.cardTitle} numberOfLines={1}>{club.name}</Text>{club.is_verified ? <Text style={styles.verified}>✓</Text> : null}</View><Text style={meta ? styles.cardMeta : styles.cardMissing} numberOfLines={1}>{meta || 'Klub tipi göstərilməyib'}</Text><Text style={club.address ? styles.cardAddress : styles.cardMissing} numberOfLines={1}>{club.address || 'Ünvan göstərilməyib'}</Text><Text style={price ? styles.cardPrice : styles.cardMissing}>{price ? formatPrice(price) : 'Qiymət göstərilməyib'}</Text></View>
    <Ionicons name="chevron-forward" size={22} color={colors.primary} />
  </Pressable>;
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  counter: { position: 'absolute', top: spacing.md, left: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  counterText: { color: colors.ink, fontWeight: '800', fontSize: 13 }, counterSubtext: { color: colors.muted, fontSize: 10, marginTop: 2 },
  clubCard: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.lg, minHeight: 132, flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 14, elevation: 7 }, pressed: { opacity: 0.85 },
  cardBody: { flex: 1, gap: spacing.xs }, cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, cardTitle: { flexShrink: 1, color: colors.ink, fontSize: 17, fontWeight: '900' }, verified: { color: colors.primary, fontSize: 16, fontWeight: '900' }, cardMeta: { color: colors.primary, fontSize: 12, fontWeight: '700' }, cardAddress: { color: colors.muted, fontSize: 13 }, cardPrice: { color: colors.success, fontSize: 12, fontWeight: '800', marginTop: spacing.xs }, cardMissing: { color: colors.faint, fontSize: 12, marginTop: spacing.xs },
});
