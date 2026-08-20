import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ScreenState } from '@/components/ScreenState';
import { ClubImage } from '@/components/ClubImage';
import { colors, radius, spacing } from '@/constants/theme';
import { clubTypeLabels, coverImage, fetchClubBySlug } from '@/lib/clubs';
import { directionsUrl, instagramUrl, phoneUrl } from '@/lib/actions';
import { formatHours, formatPrice } from '@/lib/format';
import type { Club } from '@/types/club';

function ActionButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.action} accessibilityRole="button">
      <Ionicons name={icon} size={20} color="#FFFFFF" />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

async function openExternalUrl(url: string) {
  try {
    if (!(await Linking.canOpenURL(url))) throw new Error('unsupported');
    await Linking.openURL(url);
  } catch {
    Alert.alert('Keçid açıla bilmədi', 'Bu əməliyyat cihazda hazırda dəstəklənmir.');
  }
}

export default function ClubDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { width } = useWindowDimensions();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedSlug, setLoadedSlug] = useState<string | undefined>();
  const loadClub = useCallback(async () => {
    setLoading(true);
    setLoadedSlug(undefined);
    setError(null);
    try {
      setClub(slug ? await fetchClubBySlug(slug, true) : null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Klub məlumatı alınmadı.');
    } finally {
      setLoadedSlug(slug);
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    let active = true;
    const request = slug ? fetchClubBySlug(slug) : Promise.resolve(null);
    request.then((nextClub) => {
      if (active) {
        setClub(nextClub);
        setError(null);
      }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Klub məlumatı alınmadı.');
    }).finally(() => {
      if (active) {
        setLoadedSlug(slug);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [slug]);

  if (loading || loadedSlug !== slug) return <ScreenState loading title="Klub məlumatı yüklənir" />;
  if (error) return <ScreenState title="Klub məlumatı alınmadı" message={error} actionLabel="Yenidən yoxla" onAction={() => void loadClub()} />;
  if (!club) return <ScreenState title="Klub tapılmadı" message="Bu klub aktiv deyil və ya link yanlışdır." />;

  const image = coverImage(club);
  const typeLabels = clubTypeLabels(club);
  const routeUrl = directionsUrl(club.latitude, club.longitude);
  const callUrl = phoneUrl(club.phone);
  const socialUrl = instagramUrl(club.instagram_url);
  const galleryWidth = Math.min(width, 720);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {image ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} accessibilityLabel={`${club.name} şəkilləri`}>
          {club.images.map((clubImage, index) => <ClubImage key={`${clubImage.id}:${clubImage.url}`} uri={clubImage.url} name={club.name} style={[styles.heroImage, { width: galleryWidth }]} priority={index === 0 ? 'high' : 'normal'} />)}
        </ScrollView>
      ) : (
        <View style={[styles.heroImage, styles.placeholder]}><Text style={styles.placeholderText}>GameYer</Text></View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{club.name}</Text>
          {club.is_verified ? (
            <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Təsdiqlənib</Text></View>
          ) : null}
        </View>
        <Text style={styles.meta}>{[club.district?.name, ...typeLabels].filter(Boolean).join(' · ')}</Text>
        <Text style={styles.address}>{club.address}</Text>

        <View style={styles.actions}>
          {routeUrl ? (
            <ActionButton
              icon="navigate-outline"
              label="Marşrut"
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
              ? 'Klub sahibi və ya rəsmi nümayəndə məlumatı GameYer tərəfindən təsdiqləyib.'
              : 'Məlumat açıq mənbələr əsasında göstərilir və rəsmi təsdiq gözləyir.'}
          </Text>
          <Text style={styles.disclaimer}>Qiymət və iş saatları dəyişə bilər. Getməzdən əvvəl klubun rəsmi əlaqə kanalından dəqiqləşdirin.</Text>
        </Section>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  content: { backgroundColor: colors.background, paddingBottom: 80 },
  heroImage: { width: '100%', height: 260, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryTint },
  placeholderText: { color: colors.primary, fontSize: 28, fontWeight: '900' },
  body: { padding: spacing.lg, gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { flex: 1, color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  verifiedBadge: { borderRadius: radius.pill, backgroundColor: colors.successTint, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  verifiedText: { color: colors.success, fontSize: 11, fontWeight: '800' },
  meta: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  address: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  action: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  actionText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  section: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.sm, marginTop: spacing.md },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  paragraph: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  disclaimer: { color: colors.faint, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  rowText: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  missing: { color: colors.faint, fontSize: 14, lineHeight: 22 },
});
