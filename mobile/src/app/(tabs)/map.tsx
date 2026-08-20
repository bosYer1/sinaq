import { StyleSheet, Text, View } from 'react-native';
import { ClubMap } from '@/components/ClubMap';
import { ScreenState } from '@/components/ScreenState';
import { colors, radius, spacing } from '@/constants/theme';
import { useClubData } from '@/context/ClubDataContext';

export default function MapScreen() {
  const { filteredClubs, loading, error, reload } = useClubData();
  const mapped = filteredClubs.filter(
    (club) => club.latitude != null && club.longitude != null,
  );

  if (loading) return <ScreenState loading title="Xəritə hazırlanır" />;
  if (error) return <ScreenState title="Xəritə məlumatı alınmadı" message={error} actionLabel="Yenidən yoxla" onAction={() => void reload()} />;
  if (mapped.length === 0) return <ScreenState title="Xəritədə klub tapılmadı" message="Seçilmiş filtrlərdə koordinatı təsdiqlənmiş klub yoxdur." />;

  return (
    <View style={styles.container}>
      <ClubMap clubs={mapped} />
      <View style={styles.counter} pointerEvents="none">
        <Text style={styles.counterText}>{mapped.length} klub xəritədə</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  counter: { position: 'absolute', top: spacing.md, left: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  counterText: { color: colors.ink, fontWeight: '800', fontSize: 13 },
});
