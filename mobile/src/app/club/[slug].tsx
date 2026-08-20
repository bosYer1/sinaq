import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenState } from '@/components/ScreenState';
import { colors, radius, spacing } from '@/constants/theme';
import { useClubData } from '@/context/ClubDataContext';
import { clubTypeLabels, coverImage } from '@/lib/clubs';
import { formatHours, formatPrice } from '@/lib/format';

function ActionButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.action} accessibilityRole="button">
      <Ionicons name={icon} size={20} color="#FFFFFF" />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

export default function ClubDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { clubBySlug, loading, error, reload } = useClubData();
  const club = slug ? clubBySlug(slug) : undefined;

  if (loading) return <ScreenState loading title="Klub məlumatı yüklənir" />;
  if (error) return <ScreenState title="Klub məlumatı alınmadı" message={error} actionLabel="Yenidən yoxla" onAction={() => void reload()} />;
  if (!club) return <ScreenState title="Klub tapılmadı" message="Bu klub aktiv deyil və ya link yanlışdır." />;

  const image = coverImage(club);
  const typeLabels = clubTypeLabels(club);
  const hasCoordinates = club.latitude != null && club.longitude != null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {image ? (
        <Image source={{ uri: image }} style={styles.heroImage} contentFit="cover" transition={180} />
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
          {hasCoordinates ? (
            <ActionButton
              icon="navigate-outline"
              label="Marşrut"
              onPress={() => void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${club.latitude},${club.longitude}`)}
            />
          ) : null}
          {club.phone ? (
            <ActionButton icon="call-outline" label="Zəng et" onPress={() => void Linking.openURL(`tel:${club.phone!.replace(/[^+\d]/g, '')}`)} />
          ) : null}
          {club.instagram_url ? (
            <ActionButton icon="logo-instagram" label="Instagram" onPress={() => void Linking.openURL(club.instagram_url!)} />
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
  rowText: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  missing: { color: colors.faint, fontSize: 14, lineHeight: 22 },
});
