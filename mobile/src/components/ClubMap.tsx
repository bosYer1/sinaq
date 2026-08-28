import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import type { ColorPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { clusterClubs, type ClubMapPoint } from '@/lib/mapClustering';
import type { MappableClub } from '@/types/club';
import { ScreenState } from '@/components/ScreenState';

const BAKU_REGION: Region = {
  latitude: 40.4093,
  longitude: 49.8671,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

type Props = {
  clubs: MappableClub[];
  selectedClubId: string | null;
  onSelectClub: (club: MappableClub) => void;
  onClearSelection: () => void;
};

export const ClubMap = memo(function ClubMap(props: Props) {
  const [attempt, setAttempt] = useState(0);
  return <MapSession key={attempt} {...props} onRetry={() => {
    props.onClearSelection();
    setAttempt((value) => value + 1);
  }} />;
});

function MapSession({ clubs, selectedClubId, onSelectClub, onClearSelection, onRetry }: Props & { onRetry: () => void }) {
  const { colors, scheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const mapRef = useRef<MapView>(null);
  const hasFittedRef = useRef(false);
  const fittedClubSetRef = useRef('');
  const lastFocusedClubRef = useRef<string | null>(null);
  const [region, setRegion] = useState(BAKU_REGION);
  const [mapReady, setMapReady] = useState(false);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const clubSet = useMemo(() => clubs.map((club) => club.id).sort().join(':'), [clubs]);
  const points = useMemo(() => clusterClubs(clubs, region, selectedClubId), [clubs, region, selectedClubId]);

  useEffect(() => {
    if (mapLoaded) return;
    const timer = setTimeout(() => setTimedOut(true), 15_000);
    return () => clearTimeout(timer);
  }, [mapLoaded]);

  useEffect(() => {
    // Android's newLatLngBounds requires a measured native map, not just onMapReady.
    if (!mapReady || layout.width <= 0 || layout.height <= 0 || timedOut || clubs.length === 0) return;
    if (!hasFittedRef.current || fittedClubSetRef.current !== clubSet) {
      hasFittedRef.current = true;
      fittedClubSetRef.current = clubSet;
      if (clubs.length === 1) {
        mapRef.current?.setCamera({
          center: { latitude: clubs[0].latitude, longitude: clubs[0].longitude },
          zoom: 14,
        });
        return;
      }
      mapRef.current?.fitToCoordinates(
        clubs.map((club) => ({ latitude: club.latitude, longitude: club.longitude })),
        { edgePadding: { top: Math.floor(Math.min(80, layout.height * 0.15)), right: Math.floor(Math.min(44, layout.width * 0.1)), bottom: Math.floor(Math.min(190, layout.height * 0.3)), left: Math.floor(Math.min(44, layout.width * 0.1)) }, animated: false },
      );
      return;
    }
    const selected = clubs.find((club) => club.id === selectedClubId);
    if (selected && selected.id !== lastFocusedClubRef.current) {
      lastFocusedClubRef.current = selected.id;
      mapRef.current?.animateCamera(
        { center: { latitude: selected.latitude, longitude: selected.longitude }, zoom: 15 },
        { duration: 350 },
      );
    }
    if (!selectedClubId) lastFocusedClubRef.current = null;
  }, [clubs, clubSet, mapReady, layout, timedOut, selectedClubId]);

  const openCluster = (point: Extract<ClubMapPoint, { kind: 'cluster' }>) => {
    mapRef.current?.animateToRegion({
      latitude: point.latitude,
      longitude: point.longitude,
      latitudeDelta: Math.max(region.latitudeDelta * 0.45, 0.002),
      longitudeDelta: Math.max(region.longitudeDelta * 0.45, 0.002),
    }, 300);
  };

  if (timedOut) return <ScreenState title="Xəritə yüklənmədi" message="İnterneti və cihazın xəritə xidmətlərini yoxlayın. Klub siyahısından istifadə edə bilərsiniz." actionLabel="Xəritəni yenidən aç" onAction={onRetry} />;

  return <View style={styles.map}>
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={BAKU_REGION}
      userInterfaceStyle={scheme}
      toolbarEnabled={false}
      showsCompass
      showsMyLocationButton={false}
      moveOnMarkerPress={false}
      onPress={(event) => {
        if (event.nativeEvent.action !== 'marker-press') onClearSelection();
      }}
      onMapReady={() => setMapReady(true)}
      onLayout={(event) => setLayout(event.nativeEvent.layout)}
      onMapLoaded={() => setMapLoaded(true)}
      onRegionChangeComplete={setRegion}
      accessibilityLabel="Azərbaycan gaming klubları xəritəsi"
    >
      {points.map((point) => point.kind === 'cluster' ? (
        <Marker
          key={`${point.id}:${scheme}`}
          coordinate={{ latitude: point.latitude, longitude: point.longitude }}
          stopPropagation
          onPress={() => openCluster(point)}
          accessibilityLabel={`${point.clubs.length} klub qrupu. Yaxınlaşdırmaq üçün toxunun.`}
          tracksViewChanges={false}
        >
          <View style={styles.cluster}><Text style={styles.clusterText}>{point.clubs.length}</Text></View>
        </Marker>
      ) : (
        <Marker
          key={point.id}
          coordinate={{ latitude: point.latitude, longitude: point.longitude }}
          title={point.club.name}
          description={[point.club.district?.name, point.club.address].filter(Boolean).join(' · ')}
          pinColor={point.club.id === selectedClubId ? colors.ink : point.club.is_verified ? colors.primary : colors.muted}
          zIndex={point.club.id === selectedClubId ? 1000 : 0}
          stopPropagation
          onPress={() => onSelectClub(point.club)}
        />
      ))}
    </MapView>
    {!mapLoaded ? <View style={styles.loading} pointerEvents="none"><Text style={styles.loadingText} accessibilityRole="alert">Xəritə yüklənir…</Text></View> : null}
  </View>;
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  map: { flex: 1 },
  loading: { position: 'absolute', bottom: 16, alignSelf: 'center', padding: 12, borderRadius: 12, backgroundColor: colors.surface },
  loadingText: { color: colors.ink },
  cluster: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
  },
  clusterText: { color: colors.surface, fontSize: 13, fontWeight: '900' },
});
