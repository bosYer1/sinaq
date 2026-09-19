import type { Club } from '@/types/club';

export type Position = { latitude: number; longitude: number };

export function validPosition(value: { latitude: unknown; longitude: unknown }): value is Position {
  return typeof value.latitude === 'number' && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90 &&
    typeof value.longitude === 'number' && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;
}

export function haversineKm(from: Position, to: Position): number {
  if (!validPosition(from) || !validPosition(to)) return Number.NaN;
  const radians = Math.PI / 180;
  const a = Math.sin((to.latitude - from.latitude) * radians / 2) ** 2 +
    Math.cos(from.latitude * radians) * Math.cos(to.latitude * radians) *
    Math.sin((to.longitude - from.longitude) * radians / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

export function sortByDistance(clubs: Club[], position: Position) {
  if (!validPosition(position)) return [];
  return clubs.filter((club): club is Club & Position => validPosition(club)).map((club) => ({ club, distanceKm: haversineKm(position, club) }))
    .sort((a, b) => a.distanceKm - b.distanceKm || a.club.name.localeCompare(b.club.name, 'az') || a.club.id.localeCompare(b.club.id));
}

export function formatDistance(km: number) {
  if (!Number.isFinite(km) || km < 0) return 'Məsafə məlum deyil';
  return km < 0.1 ? '<0.1 km' : `${km.toFixed(1)} km`;
}
