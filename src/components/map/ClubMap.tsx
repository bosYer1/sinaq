'use client';

import { useEffect } from 'react';
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import type { ClubWithDistance } from '@/types/database';
import type { UserLocation } from '@/hooks/useUserLocation';
import { ClubMarker } from './ClubMarker';

interface ClubMapProps {
  clubs: ClubWithDistance[];
  activeClubId?: string | null;
  onSelectClub?: (id: string) => void;
  userLocation?: UserLocation | null;
  locationFocusRequest?: number;
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

function MapViewportHandler({
  clubs,
  activeClubId,
  userLocation,
  locationFocusRequest,
}: {
  clubs: ClubWithDistance[];
  activeClubId?: string | null;
  userLocation?: UserLocation | null;
  locationFocusRequest?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (userLocation && locationFocusRequest && locationFocusRequest > 0) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.45 });
      return;
    }

    const clubsWithCoords = clubs.filter(
      (club) => club.latitude != null && club.longitude != null
    );

    if (clubsWithCoords.length === 0) {
      map.setView([40.4093, 49.8671], 12);
      return;
    }

    const activeClub = clubsWithCoords.find(
      (club) => club.id === activeClubId
    );

    if (
      activeClub &&
      activeClub.latitude != null &&
      activeClub.longitude != null
    ) {
      map.flyTo(
        [activeClub.latitude, activeClub.longitude],
        Math.max(map.getZoom(), 14),
        { duration: 0.45 }
      );
      return;
    }

    if (clubsWithCoords.length === 1) {
      const club = clubsWithCoords[0];
      map.setView([club.latitude!, club.longitude!], 14);
      return;
    }

    const bounds = clubsWithCoords.map(
      (club) => [club.latitude!, club.longitude!] as [number, number]
    );

    map.fitBounds(bounds, {
      padding: [36, 36],
      maxZoom: 14,
      animate: false,
    });
  }, [map, clubs, activeClubId, userLocation, locationFocusRequest]);

  return null;
}

export function ClubMap({
  clubs,
  activeClubId,
  onSelectClub,
  userLocation,
  locationFocusRequest = 0,
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
      <MapViewportHandler
        clubs={clubs}
        activeClubId={activeClubId}
        userLocation={userLocation}
        locationFocusRequest={locationFocusRequest}
      />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {userLocation ? (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={8}
          pathOptions={{
            color: '#ffffff',
            weight: 3,
            fillColor: '#2563EB',
            fillOpacity: 1,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]} permanent={false}>
            Sənin konumun
          </Tooltip>
        </CircleMarker>
      ) : null}

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
