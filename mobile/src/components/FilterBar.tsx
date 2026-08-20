import { ScrollView, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { useClubData } from '@/context/ClubDataContext';

type ChipProps = { label: string; selected: boolean; onPress: () => void };

function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function FilterBar() {
  const { filters, setFilters, clearFilters, districts, types } = useClubData();
  const active = Boolean(filters.query || filters.district || filters.type || filters.verifiedOnly);

  return (
    <View style={styles.container}>
      <TextInput
        value={filters.query}
        onChangeText={(query) => setFilters({ query })}
        placeholder="Klub, şəhər və ya ünvan axtar"
        placeholderTextColor={colors.faint}
        style={styles.input}
        returnKeyType="search"
        autoCapitalize="none"
        accessibilityLabel="Klub axtarışı"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip label="Hamısı" selected={!filters.type} onPress={() => setFilters({ type: null })} />
        {types.map((type) => (
          <Chip key={type.id} label={type.name} selected={filters.type === type.slug} onPress={() => setFilters({ type: type.slug })} />
        ))}
        <Chip label="Təsdiqlənmiş" selected={filters.verifiedOnly} onPress={() => setFilters({ verifiedOnly: !filters.verifiedOnly })} />
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip label="Bütün şəhər/rayonlar" selected={!filters.district} onPress={() => setFilters({ district: null })} />
        {districts.map((district) => (
          <Chip key={district.id} label={district.name} selected={filters.district === district.slug} onPress={() => setFilters({ district: district.slug })} />
        ))}
        {active ? <Chip label="Təmizlə" selected={false} onPress={clearFilters} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingBottom: spacing.md },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: spacing.lg, fontSize: 15 },
  row: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: { minHeight: 42, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.lg },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: colors.primaryDark },
});
