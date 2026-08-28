import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AppState, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ClubCard } from '@/components/ClubCard';
import { FilterBar } from '@/components/FilterBar';
import { ScreenState } from '@/components/ScreenState';
import { spacing, type ColorPalette } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { useClubData } from '@/context/ClubDataContext';
import { formatDistance, sortByDistance, type Position } from '@/lib/distance';
import { LOCATION_MESSAGES, requestPosition } from '@/lib/location';

export default function NearbyScreen() {
  const styles = useThemedStyles(createStyles);
  const { filteredClubs, loading, error, reload, clearFilters } = useClubData();
  const [position, setPosition] = useState<Position | null>(null);
  const [status, setStatus] = useState<keyof typeof LOCATION_MESSAGES>('idle');
  const activeRequest = useRef<AbortController | null>(null);
  const rows = useMemo(() => position ? sortByDistance(filteredClubs, position) : [], [filteredClubs, position]);

  useFocusEffect(useCallback(() => {
    const clear = () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
      setPosition(null);
      setStatus('idle');
    };
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'background') clear();
    });
    return () => { listener.remove(); clear(); };
  }, []));

  const locate = async () => {
    if (activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setStatus('loading');
    setPosition(null);
    const result = await requestPosition(controller.signal);
    if (controller.signal.aborted || activeRequest.current !== controller) return;
    activeRequest.current = null;
    if (result.status === 'cancelled') { setStatus('idle'); return; }
    setStatus(result.status);
    if (result.status === 'ready') setPosition(result.position);
  };

  return <FlatList
    data={rows}
    keyExtractor={({ club }) => club.id}
    contentContainerStyle={styles.content}
    keyboardShouldPersistTaps="handled"
    keyboardDismissMode="on-drag"
    initialNumToRender={8}
    windowSize={7}
    ListHeaderComponent={<View style={styles.header}>
      <Text style={styles.title}>Yaxınınızdakı klublar</Text>
      <Text style={styles.text} accessibilityLiveRegion="polite">{LOCATION_MESSAGES[status]}</Text>
      <Pressable style={styles.button} disabled={status === 'loading'} accessibilityRole="button" accessibilityState={{ disabled: status === 'loading', busy: status === 'loading' }} onPress={() => void locate()}>
        <Text style={styles.buttonText}>{status === 'loading' ? 'Gözləyin…' : 'Mövqeyimi istifadə et'}</Text>
      </Pressable>
      {status === 'blocked' ? <Pressable style={styles.button} accessibilityRole="button" onPress={() => void Linking.openSettings().catch(() => setStatus('error'))}><Text style={styles.buttonText}>Cihaz ayarlarını aç</Text></Pressable> : null}
      <Text style={styles.text}>Mövqe yalnız bu ekran açıq olduğu müddətdə yaddaşda saxlanılır. Background izləmə yoxdur.</Text>
      <FilterBar />
      {loading ? <ScreenState loading title="Klublar yüklənir" /> : error ? <ScreenState title="Yeniləmə alınmadı" message="İnternet bağlantısını yoxlayın. Mövcud nəticələr saxlanılıb." actionLabel="Yenidən yoxla" onAction={() => void reload()} /> : null}
      {position ? <Text style={styles.text}>{rows.length} nəticə · məsafəyə görə</Text> : null}
    </View>}
    ListEmptyComponent={position && !loading && !error ? <ScreenState title="Yaxınlıq üçün uyğun klub yoxdur" message="Koordinatlı klublar göstərilir. Filtrləri sıfırlaya bilərsiniz." actionLabel="Filtrləri sıfırla" onAction={clearFilters} /> : null}
    renderItem={({ item }) => <View style={styles.result}><Text style={styles.distance}>{formatDistance(item.distanceKm)} · təxmini</Text><ClubCard club={item.club} /></View>}
  />;
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.lg, backgroundColor: colors.background, paddingBottom: 32 },
  header: { gap: spacing.md }, title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  text: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  button: { minHeight: 48, padding: spacing.md, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center' },
  buttonText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
  result: { marginTop: spacing.md, gap: spacing.sm }, distance: { color: colors.primary, fontWeight: '700' },
});
