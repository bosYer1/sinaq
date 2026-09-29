import { clusterClubs } from '@/lib/mapClustering';
import type { MappableClub } from '@/types/club';

const club = (id: string, latitude: number, longitude: number): MappableClub => ({
  id, name: id, slug: id, description: null, address: '', latitude, longitude,
  phone: null, instagram_url: null, profile_image_url: null, is_active: true, is_premium: false, premium_expires_at: null,
  is_verified: false, verified_at: null, updated_at: '2026-08-20', district: null,
  type_assignments: [], pricing: [], images: [], opening_hours: [],
});

const REGION = { latitude: 40.4, longitude: 49.8, latitudeDelta: 1, longitudeDelta: 1 };

describe('clusterClubs', () => {
  test('groups dense clubs and separates them as the camera zooms in', () => {
    const clubs = [club('a', 40.4, 49.8), club('b', 40.401, 49.801)];
    expect(clusterClubs(clubs, REGION, null)).toHaveLength(1);
    expect(clusterClubs(clubs, { ...REGION, latitudeDelta: 0.001, longitudeDelta: 0.001 }, null)).toHaveLength(2);
  });

  test('keeps the selected club outside its cluster', () => {
    const points = clusterClubs([club('a', 40.4, 49.8), club('b', 40.401, 49.801)], REGION, 'a');
    expect(points.some((point) => point.kind === 'club' && point.id === 'a')).toBe(true);
  });

  test('keeps exact overlapping coordinates clustered at close zoom', () => {
    const clubs = [club('a', 40.4, 49.8), club('b', 40.4, 49.8)];
    expect(clusterClubs(clubs, { ...REGION, latitudeDelta: 0.00001, longitudeDelta: 0.00001 }, null)[0]?.kind).toBe('cluster');
  });
});
