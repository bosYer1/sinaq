import type { Region } from 'react-native-maps';
import type { Club } from '@/types/club';

export type ClubMapPoint =
  | { kind: 'club'; id: string; club: Club; latitude: number; longitude: number }
  | { kind: 'cluster'; id: string; clubs: Club[]; latitude: number; longitude: number };

const LATITUDE_CELLS = 8;
const LONGITUDE_CELLS = 6;
const MINIMUM_CELL_SIZE = 0.00012;

export function clusterClubs(clubs: Club[], region: Region, selectedClubId: string | null): ClubMapPoint[] {
  const latitudeCellSize = Math.max(region.latitudeDelta / LATITUDE_CELLS, MINIMUM_CELL_SIZE);
  const longitudeCellSize = Math.max(region.longitudeDelta / LONGITUDE_CELLS, MINIMUM_CELL_SIZE);
  const groups = new Map<string, Club[]>();
  const selected = clubs.find((club) => club.id === selectedClubId);

  for (const club of clubs) {
    if (club.id === selectedClubId || club.latitude == null || club.longitude == null) continue;
    const key = `${Math.floor(club.latitude / latitudeCellSize)}:${Math.floor(club.longitude / longitudeCellSize)}`;
    const group = groups.get(key);
    if (group) group.push(club);
    else groups.set(key, [club]);
  }

  const points: ClubMapPoint[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      const club = group[0];
      points.push({ kind: 'club', id: club.id, club, latitude: club.latitude!, longitude: club.longitude! });
      continue;
    }
    const ids = group.map((club) => club.id).sort();
    points.push({
      kind: 'cluster',
      id: `cluster:${ids.join(',')}`,
      clubs: group,
      latitude: group.reduce((sum, club) => sum + club.latitude!, 0) / group.length,
      longitude: group.reduce((sum, club) => sum + club.longitude!, 0) / group.length,
    });
  }

  if (selected?.latitude != null && selected.longitude != null) {
    points.push({ kind: 'club', id: selected.id, club: selected, latitude: selected.latitude, longitude: selected.longitude });
  }
  return points;
}
