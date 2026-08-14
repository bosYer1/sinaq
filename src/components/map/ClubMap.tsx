'use client';

import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  useMap,
} from 'react-leaflet';
import type { ClubWithDistance } from '@/types/database';
import { ClubMarker } from './ClubMarker';

interface ClubMapProps {
  clubs: ClubWithDistance[];
  activeClubId?: string | null;
  onSelectClub?: (id: string) => void;
}

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const invalidate = () => {
      window.requestAnimationFrame(() => {
        map.invalidateSize(false);
      });
    };

    const timer = window.setTimeout(invalidate, 100);

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.clearTimeout(timer);
      };
    }

    const observer = new ResizeObserver(invalidate);
    observer.observe(container);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

export function ClubMap({
  clubs,
  activeClubId,
  onSelectClub,
}: ClubMapProps) {
  const clubsWithCoords = clubs.filter(
    (club) =>
      club.latitude != null &&
      club.longitude != null
  );

  return (
    <MapContainer
      center={[40.4093, 49.8671]}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
    >
      <MapResizeHandler />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {clubsWithCoords.map((club) => (
        <ClubMarker
          key={club.id}
          club={club}
          isActive={club.id === activeClubId}
          onSelect={onSelectClub}
        />
      ))}
    </MapContainer>
  );
}
