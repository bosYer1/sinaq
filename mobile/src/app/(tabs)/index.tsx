import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ClubCard } from '@/components/ClubCard';
import { FilterBar } from '@/components/FilterBar';
import { ScreenState } from '@/components/ScreenState';
import { colors, spacing } from '@/constants/theme';
import { useClubData } from '@/context/ClubDataContext';

export default function DiscoveryScreen() {
  const { filteredClubs, clubs, loading, refreshing, error, reload } = useClubData();

  if (loading) return <DiscoverySkeleton />;
  if (error && clubs.length === 0) return <ScreenState title="Məlumat alınmadı" message={error} actionLabel="Yenidən yoxla" onAction={() => void reload()} />;

  return (
    <FlatList
      data={filteredClubs}
      keyExtractor={(club) => club.id}
      renderItem={({ item }) => <ClubCard club={item} />}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void reload()} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>AZƏRBAYCAN ÜZRƏ GAMING MƏKANLARI</Text>
            <Text style={styles.heading}>Oyun üçün doğru məkanı tap</Text>
            <Text style={styles.subheading}>{clubs.length} aktiv klub · real və təsdiqlənən məlumatlar</Text>
          </View>
          <FilterBar />
          {error ? <View style={styles.warning}><Text style={styles.warningText}>Yeniləmə alınmadı. Son uğurlu nəticələr göstərilir.</Text></View> : null}
          <Text style={styles.result}>{filteredClubs.length} nəticə</Text>
        </View>
      }
      ListEmptyComponent={<ScreenState title="Uyğun klub tapılmadı" message="Filtrləri dəyişərək yenidən yoxlayın." />}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
    />
  );
}

function DiscoverySkeleton() {
  return <View style={styles.skeletonPage} accessibilityLabel="Klublar yüklənir">
    <View style={[styles.skeleton, styles.skeletonHeading]} />
    <View style={[styles.skeleton, styles.skeletonSearch]} />
    {[0, 1, 2].map((item) => <View key={item} style={[styles.skeleton, styles.skeletonCard]} />)}
  </View>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 90, flexGrow: 1 },
  hero: { paddingVertical: spacing.md, gap: spacing.xs },
  eyebrow: { color: colors.primary, fontSize: 11, letterSpacing: 0.8, fontWeight: '800' },
  heading: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  subheading: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  result: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: spacing.md },
  separator: { height: spacing.md },
  warning: { borderRadius: 12, backgroundColor: colors.warningTint, padding: spacing.md, marginBottom: spacing.md },
  warningText: { color: colors.warning, fontSize: 12, lineHeight: 18 },
  skeletonPage: { flex: 1, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  skeleton: { backgroundColor: colors.surfaceAlt, borderRadius: 14 },
  skeletonHeading: { width: '75%', height: 70, marginTop: spacing.lg },
  skeletonSearch: { width: '100%', height: 50 },
  skeletonCard: { width: '100%', height: 138 },
});
