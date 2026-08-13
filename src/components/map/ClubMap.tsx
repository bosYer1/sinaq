'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { ClubWithDistance } from '@/types/database';
import { ClubMarker } from './ClubMarker';

// Bakının mərkəzi — heç bir klubun koordinatı olmayanda default görünüş.
const BAKU_CENTER: [number, number] = [40.3777, 49.892];
const DEFAULT_ZOOM = 12;

interface ClubMapProps {
  clubs: ClubWithDistance[];
  activeClubId?: string | null;
  onSelectClub?: (id: string) => void;
}

/** activeClubId dəyişəndə xəritəni həmin klubun üzərinə rəvan sürüşdürür. */
function FlyToActiveClub({ club }: { club: ClubWithDistance | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (club && club.latitude != null && club.longitude != null) {
      map.flyTo([club.latitude, club.longitude], Math.max(map.getZoom(), 14), { duration: 0.6 });
    }
  }, [club, map]);

  return null;
}

export function ClubMap({ clubs, activeClubId, onSelectClub }: ClubMapProps) {
  const clubsWithCoords = clubs.filter((c) => c.latitude != null && c.longitude != null);
  const activeClub = clubsWithCoords.find((c) => c.id === activeClubId);

  return (
    <MapContainer
      center={BAKU_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
      // Xəritə çubuğunu default OSM logolu vəziyyətdə saxlayırıq —
      // OpenStreetMap-in istifadə şərtlərinə görə atribusiya mütləqdir.
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> müəllifləri'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {clubsWithCoords.map((club) => (
        <ClubMarker key={club.id} club={club} isActive={club.id === activeClubId} onSelect={onSelectClub} />
      ))}
      <FlyToActiveClub club={activeClub} />
    </MapContainer>
  );
}
