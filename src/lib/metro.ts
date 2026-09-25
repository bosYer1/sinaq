import type { ClubWithRelations } from '@/types/database';

export type MetroStation = {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
};

export const METRO_FILTER_RADIUS_KM = 2;

export const BAKU_METRO_STATIONS: MetroStation[] = [
  { slug: 'avtovagzal', name: 'Avtovağzal', latitude: 40.421508, longitude: 49.795215 },
  { slug: 'azadliq-prospekti', name: 'Azadlıq prospekti', latitude: 40.425962, longitude: 49.842926 },
  { slug: 'dernegul', name: 'Dərnəgül', latitude: 40.425402, longitude: 49.861788 },
  { slug: 'nesimi', name: 'Nəsimi', latitude: 40.424645, longitude: 49.826280 },
  { slug: 'xocesen', name: 'Xocəsən', latitude: 40.423082, longitude: 49.779611 },
  { slug: 'bakmil', name: 'Bakmil', latitude: 40.414140, longitude: 49.878796 },
  { slug: 'genclik', name: 'Gənclik', latitude: 40.399879, longitude: 49.850956 },
  { slug: 'neriman-nerimanov', name: 'Nəriman Nərimanov', latitude: 40.402822, longitude: 49.870638 },
  { slug: 'ulduz', name: 'Ulduz', latitude: 40.414963, longitude: 49.891435 },
  { slug: '28-may-cafer-cabbarli', name: '28 May / Cəfər Cabbarlı', latitude: 40.379757, longitude: 49.848793 },
  { slug: '8-noyabr', name: '8 Noyabr', latitude: 40.401867, longitude: 49.820509 },
  { slug: 'memar-ecemi', name: 'Memar Əcəmi', latitude: 40.410581, longitude: 49.813195 },
  { slug: 'koroglu', name: 'Koroğlu', latitude: 40.420864, longitude: 49.918094 },
  { slug: 'neftciler', name: 'Neftçilər', latitude: 40.411155, longitude: 49.942568 },
  { slug: 'qara-qarayev', name: 'Qara Qarayev', latitude: 40.417612, longitude: 49.933959 },
  { slug: 'xalqlar-dostlugu', name: 'Xalqlar Dostluğu', latitude: 40.396885, longitude: 49.952986 },
  { slug: 'iceriseher', name: 'İçərişəhər', latitude: 40.365959, longitude: 49.831647 },
  { slug: 'sahil', name: 'Sahil', latitude: 40.371726, longitude: 49.844572 },
  { slug: 'ehmedli', name: 'Əhmədli', latitude: 40.385558, longitude: 49.953945 },
  { slug: 'hezi-aslanov', name: 'Həzi Aslanov', latitude: 40.373038, longitude: 49.953574 },
  { slug: 'sah-ismayil-xetai', name: 'Şah İsmayıl Xətai', latitude: 40.383251, longitude: 49.872145 },
  { slug: '20-yanvar', name: '20 Yanvar', latitude: 40.404139, longitude: 49.807702 },
  { slug: 'elmler-akademiyasi', name: 'Elmlər Akademiyası', latitude: 40.375152, longitude: 49.815484 },
  { slug: 'insaatcilar', name: 'İnşaatçılar', latitude: 40.389094, longitude: 49.802357 },
  { slug: 'nizami', name: 'Nizami', latitude: 40.379319, longitude: 49.830019 },
];

function toRadians(value: number) {
  return value * Math.PI / 180;
}

function distanceKm(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestMetroStation(club: Pick<ClubWithRelations, 'latitude' | 'longitude'>) {
  const latitude = Number(club.latitude);
  const longitude = Number(club.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  let nearest: { station: MetroStation; distanceKm: number } | null = null;

  for (const station of BAKU_METRO_STATIONS) {
    const stationDistanceKm = distanceKm(latitude, longitude, station.latitude, station.longitude);
    if (!nearest || stationDistanceKm < nearest.distanceKm) {
      nearest = { station, distanceKm: stationDistanceKm };
    }
  }

  if (!nearest || nearest.distanceKm > METRO_FILTER_RADIUS_KM) return null;
  return nearest;
}

export function clubMatchesMetro(club: Pick<ClubWithRelations, 'latitude' | 'longitude'>, metroSlug: string) {
  return getNearestMetroStation(club)?.station.slug === metroSlug;
}

export function getAvailableMetroStations(clubs: Array<Pick<ClubWithRelations, 'latitude' | 'longitude'>>) {
  const availableSlugs = new Set<string>();
  for (const club of clubs) {
    const nearest = getNearestMetroStation(club);
    if (nearest) availableSlugs.add(nearest.station.slug);
  }

  return BAKU_METRO_STATIONS.filter((station) => availableSlugs.has(station.slug));
}
