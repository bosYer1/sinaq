import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ClubCard } from '@/components/ClubCard';
import { FilterBar } from '@/components/FilterBar';
import { ScreenState } from '@/components/ScreenState';
import { colors, spacing } from '@/constants/theme';
import { useClubData } from '@/context/ClubDataContext';

export default function DiscoveryScreen() {
  const { filteredClubs, clubs, loading, refreshing, error, reload } = useClubData();

  if (loading) return <ScreenState loading title="Klublar yüklənir" message="GameYer məlumatları təhlükəsiz şəkildə alınır." />;
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
          <Text style={styles.result}>{filteredClubs.length} nəticə</Text>
        </View>
      }
      ListEmptyComponent={<ScreenState title="Uyğun klub tapılmadı" message="Filtrləri dəyişərək yenidən yoxlayın." />}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 90, flexGrow: 1 },
  hero: { paddingVertical: spacing.md, gap: spacing.xs },
  eyebrow: { color: colors.primary, fontSize: 11, letterSpacing: 0.8, fontWeight: '800' },
  heading: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  subheading: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  result: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: spacing.md },
  separator: { height: spacing.md },
});
