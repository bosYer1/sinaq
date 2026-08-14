'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { ClubWithRelations } from '@/types/database';
import { ClubMarker } from './ClubMarker';

const BAKU_CENTER: [number, number] = [40.3777, 49.892];
const DEFAULT_ZOOM = 12;

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export function ClubMap({ clubs }: { clubs: ClubWithRelations[] }) {
  const clubsWithCoords = clubs.filter((c) => c.latitude != null && c.longitude != null);

  return (
    <MapContainer
      center={BAKU_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> müəllifləri'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapResizeHandler />
      {clubsWithCoords.map((club) => (
        <ClubMarker key={club.id} club={club} />
      ))}
    </MapContainer>
  );
}
