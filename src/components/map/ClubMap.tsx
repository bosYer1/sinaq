'use client';

import { useEffect, useRef } from 'react';
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
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    const container = map.getContainer();
    observer.observe(container);

    return () => {
      clearTimeout(timer);
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
  const mapRef = useRef<L.Map | null>(null);

  const clubsWithCoords = clubs.filter(
    (club) =>
      club.latitude != null &&
      club.longitude != null
  );

  const center: [number, number] = [40.4093, 49.8671];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
      ref={mapRef}
    >
      <MapResizeHandler />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
