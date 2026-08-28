import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ScreenState } from '@/components/ScreenState';
import { ClubImage } from '@/components/ClubImage';
import { radius, spacing, type ColorPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { clubTypeLabels, coverImage, fetchClubBySlug, isPremiumActive } from '@/lib/clubs';
import { detailImages } from '@/lib/detail';
import { openExternalUrl } from '@/lib/openExternal';
import { directionsUrl, instagramUrl, phoneUrl } from '@/lib/actions';
import { formatHours, formatPrice } from '@/lib/format';
import type { Club } from '@/types/club';

function ActionButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable onPress={onPress} style={styles.action} accessibilityRole="button">
      <Ionicons name={icon} size={20} color={colors.onPrimary} />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

export default function ClubDetailScreen() {
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { width } = useWindowDimensions();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedSlug, setLoadedSlug] = useState<string | undefined>();
  const requestSequence = useRef(0);
  const loadClub = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setLoadedSlug(undefined);
    setError(null);
    try {
      const nextClub = slug ? await fetchClubBySlug(slug, true) : null;
      if (requestSequence.current === requestId) setClub(nextClub);
    } catch {
      if (requestSequence.current === requestId) {
        setError('Klub məlumatı alınmadı. İnternet bağlantısını yoxlayıb yenidən cəhd edin.');
      }
    } finally {
      if (requestSequence.current === requestId) {
        setLoadedSlug(slug);
        setLoading(false);
      }
    }
  }, [slug]);

  useEffect(() => {
    const requestId = ++requestSequence.current;
    const request = slug ? fetchClubBySlug(slug) : Promise.resolve(null);
    request.then((nextClub) => {
      if (requestSequence.current === requestId) {
        setClub(nextClub);
        setError(null);
      }
    }).catch(() => {
      if (requestSequence.current === requestId) {
        setError('Klub məlumatı alınmadı. İnternet bağlantısını yoxlayıb yenidən cəhd edin.');
      }
    }).finally(() => {
      if (requestSequence.current === requestId) {
        setLoadedSlug(slug);
        setLoading(false);
      }
    });
    return () => { requestSequence.current += 1; };
  }, [slug]);

  if (loading || loadedSlug !== slug) return <ScreenState loading title="Klub məlumatı yüklənir" />;
  if (error) return <ScreenState title="Klub məlumatı alınmadı" message={error} actionLabel="Yenidən yoxla" onAction={() => void loadClub()} />;
  if (!club) return <ScreenState title="Klub tapılmadı" message="Bu klub aktiv deyil və ya link yanlışdır." />;

  const image = coverImage(club);
  const galleryImages = detailImages(club);
  const typeLabels = clubTypeLabels(club);
  const meta = [club.district?.name, ...typeLabels].filter(Boolean).join(' · ');
  const routeUrl = directionsUrl(club.latitude, club.longitude);
  const callUrl = phoneUrl(club.phone);
  const socialUrl = instagramUrl(club.instagram_url);
  const galleryWidth = Math.min(width, 720);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {image ? (
        <FlatList
          horizontal
          pagingEnabled
          snapToInterval={galleryWidth}
          disableIntervalMomentum
          data={galleryImages}
          keyExtractor={(clubImage) => `${clubImage.id}:${clubImage.url}`}
          renderItem={({ item: clubImage, index }) => <ClubImage uri={clubImage.url} name={club.name} style={[styles.heroImage, { width: galleryWidth }]} priority={index === 0 ? 'high' : 'normal'} />}
          getItemLayout={(_, index) => ({ length: galleryWidth, offset: galleryWidth * index, index })}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          showsHorizontalScrollIndicator={false}
          accessibilityLabel={`${club.name} şəkilləri`}
        />
      ) : (
        <View style={[styles.heroImage, styles.placeholder]}><Text style={styles.placeholderText}>Şəkil yoxdur</Text></View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{club.name}</Text>
          {club.is_verified ? (
            <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Təsdiqlənib</Text></View>
          ) : null}
        </View>
        {isPremiumActive(club) ? <Text style={styles.meta}>Premium</Text> : null}
        <Text style={meta ? styles.meta : styles.missing}>{meta || 'Klub tipi göstərilməyib'}</Text>
        <Text selectable style={club.address ? styles.address : styles.missing}>{club.address || 'Ünvan göstərilməyib'}</Text>
        {callUrl ? <Text selectable style={styles.address}>Telefon: {club.phone}</Text> : null}

        <View style={styles.actions}>
          {routeUrl ? (
            <ActionButton
              icon="navigate-outline"
              label="İstiqamət al"
              onPress={() => void openExternalUrl(routeUrl)}
            />
          ) : null}
          {callUrl ? (
            <ActionButton icon="call-outline" label="Zəng et" onPress={() => void openExternalUrl(callUrl)} />
          ) : null}
          {socialUrl ? (
            <ActionButton icon="logo-instagram" label="Instagram" onPress={() => void openExternalUrl(socialUrl)} />
          ) : null}
        </View>

        {club.description ? <Section title="Haqqında"><Text style={styles.paragraph}>{club.description}</Text></Section> : null}

        <Section title="Qiymətlər">
          {club.pricing.length > 0
            ? club.pricing.map((price) => <Text key={price.id} style={styles.rowText}>{formatPrice(price)}</Text>)
            : <Text style={styles.missing}>Təsdiqlənmiş qiymət göstərilməyib.</Text>}
        </Section>

        <Section title="İş saatları">
          {club.opening_hours.length > 0
            ? club.opening_hours.map((hours) => <Text key={hours.id} style={styles.rowText}>{formatHours(hours)}</Text>)
            : <Text style={styles.missing}>İş saatları göstərilməyib.</Text>}
        </Section>

        <Section title="Məlumat statusu">
          <Text style={styles.paragraph}>
            {club.is_verified
              ? 'Klub məlumatı təsdiqlənmiş kimi qeyd olunub.'
              : 'Klub məlumatı təsdiqlənmiş kimi qeyd olunmayıb.'}
          </Text>
          <Text style={styles.disclaimer}>Qiymət və iş saatları dəyişə bilər. Getməzdən əvvəl klubun rəsmi əlaqə kanalından dəqiqləşdirin.</Text>
        </Section>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  content: { backgroundColor: colors.background, paddingBottom: 80 },
  heroImage: { width: '100%', height: 260, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryTint },
  placeholderText: { color: colors.primary, fontSize: 28, fontWeight: '900' },
  body: { padding: spacing.lg, gap: spacing.sm },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: spacing.sm },
  title: { flex: 1, minWidth: 140, color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  verifiedBadge: { borderRadius: radius.pill, backgroundColor: colors.successTint, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  verifiedText: { color: colors.success, fontSize: 11, fontWeight: '800' },
  meta: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  address: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  action: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  actionText: { color: colors.onPrimary, fontWeight: '800', fontSize: 14 },
  section: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.sm, marginTop: spacing.md },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  paragraph: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  disclaimer: { color: colors.faint, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  rowText: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  missing: { color: colors.faint, fontSize: 14, lineHeight: 22 },
});
