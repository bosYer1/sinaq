import { memo, useEffect, useRef } from 'react';
import MapView, { Marker, type Region } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import type { Club } from '@/types/club';

const AZERBAIJAN_REGION: Region = { latitude: 40.28, longitude: 47.75, latitudeDelta: 6.2, longitudeDelta: 6.2 };

type Props = { clubs: Club[]; selectedClubId: string | null; onSelectClub: (club: Club) => void; onClearSelection: () => void };

export const ClubMap = memo(function ClubMap({ clubs, selectedClubId, onSelectClub, onClearSelection }: Props) {
  const mapRef = useRef<MapView>(null);
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (clubs.length === 0) return;
    if (!hasFittedRef.current) {
      hasFittedRef.current = true;
      mapRef.current?.fitToCoordinates(
        clubs.map((club) => ({ latitude: club.latitude!, longitude: club.longitude! })),
        { edgePadding: { top: 80, right: 44, bottom: 190, left: 44 }, animated: false },
      );
      return;
    }
    const selected = clubs.find((club) => club.id === selectedClubId);
    if (selected) mapRef.current?.animateCamera({ center: { latitude: selected.latitude!, longitude: selected.longitude! }, zoom: 15 }, { duration: 350 });
  }, [clubs, selectedClubId]);

  return (
    <MapView ref={mapRef} style={styles.map} initialRegion={AZERBAIJAN_REGION} toolbarEnabled={false} showsCompass showsMyLocationButton={false} loadingEnabled loadingIndicatorColor={colors.primary} loadingBackgroundColor={colors.surfaceAlt} moveOnMarkerPress={false} onPress={onClearSelection} accessibilityLabel="Azərbaycan gaming klubları xəritəsi">
      {clubs.map((club) => {
        const selected = club.id === selectedClubId;
        return <Marker key={club.id} coordinate={{ latitude: club.latitude!, longitude: club.longitude! }} title={club.name} description={[club.district?.name, club.address].filter(Boolean).join(' · ')} pinColor={selected ? colors.ink : club.is_verified ? colors.primary : colors.muted} zIndex={selected ? 1000 : 0} stopPropagation onPress={() => onSelectClub(club)} />;
      })}
    </MapView>
  );
});

const styles = StyleSheet.create({ map: { flex: 1 } });
