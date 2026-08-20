import MapView, { Marker, type Region } from 'react-native-maps';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import type { Club } from '@/types/club';

const AZERBAIJAN_REGION: Region = {
  latitude: 40.28,
  longitude: 47.75,
  latitudeDelta: 6.2,
  longitudeDelta: 6.2,
};

export function ClubMap({ clubs }: { clubs: Club[] }) {
  return (
    <MapView
      style={styles.map}
      initialRegion={AZERBAIJAN_REGION}
      toolbarEnabled={false}
      showsCompass
      showsMyLocationButton={false}
      accessibilityLabel="Azərbaycan gaming klubları xəritəsi"
    >
      {clubs.map((club) => (
        <Marker
          key={club.id}
          coordinate={{ latitude: club.latitude!, longitude: club.longitude! }}
          title={club.name}
          description={[club.district?.name, club.address].filter(Boolean).join(' · ')}
          pinColor={club.is_verified ? colors.primary : colors.muted}
          onCalloutPress={() => router.push({ pathname: '/club/[slug]', params: { slug: club.slug } })}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
