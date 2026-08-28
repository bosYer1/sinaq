import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import type { ColorPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { clusterClubs, type ClubMapPoint } from '@/lib/mapClustering';
import type { MappableClub } from '@/types/club';

const AZERBAIJAN_REGION: Region = {
  latitude: 40.28,
  longitude: 47.75,
  latitudeDelta: 6.2,
  longitudeDelta: 6.2,
};

type Props = {
  clubs: MappableClub[];
  selectedClubId: string | null;
  onSelectClub: (club: MappableClub) => void;
  onClearSelection: () => void;
};

export const ClubMap = memo(function ClubMap({ clubs, selectedClubId, onSelectClub, onClearSelection }: Props) {
  const { colors, scheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const mapRef = useRef<MapView>(null);
  const hasFittedRef = useRef(false);
  const fittedClubSetRef = useRef('');
  const lastFocusedClubRef = useRef<string | null>(null);
  const [region, setRegion] = useState(AZERBAIJAN_REGION);
  const [mapReady, setMapReady] = useState(false);
  const clubSet = useMemo(() => clubs.map((club) => club.id).sort().join(':'), [clubs]);
  const points = useMemo(() => clusterClubs(clubs, region, selectedClubId), [clubs, region, selectedClubId]);

  useEffect(() => {
    if (!mapReady || clubs.length === 0) return;
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
        { edgePadding: { top: 80, right: 44, bottom: 190, left: 44 }, animated: false },
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
  }, [clubs, clubSet, mapReady, selectedClubId]);

  const openCluster = (point: Extract<ClubMapPoint, { kind: 'cluster' }>) => {
    mapRef.current?.animateToRegion({
      latitude: point.latitude,
      longitude: point.longitude,
      latitudeDelta: Math.max(region.latitudeDelta * 0.45, 0.002),
      longitudeDelta: Math.max(region.longitudeDelta * 0.45, 0.002),
    }, 300);
  };

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={AZERBAIJAN_REGION}
      userInterfaceStyle={scheme}
      toolbarEnabled={false}
      showsCompass
      showsMyLocationButton={false}
      moveOnMarkerPress={false}
      onPress={onClearSelection}
      onMapReady={() => setMapReady(true)}
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
  );
});

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  map: { flex: 1 },
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
