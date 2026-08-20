'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { ClubWithDistance } from '@/types/database';
import type { UserLocation } from '@/hooks/useUserLocation';
import { Skeleton } from '@/components/ui/Skeleton';

const ClubMap = dynamic(() => import('./ClubMap').then((mod) => mod.ClubMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

interface MapWrapperProps {
  clubs: ClubWithDistance[];
  activeClubId?: string | null;
  onSelectClub?: (id: string) => void;
  userLocation?: UserLocation | null;
  locationFocusRequest?: number;
  interactionMode?: 'full' | 'scroll';
}

export function MapWrapper({
  clubs,
  activeClubId,
  onSelectClub,
  userLocation,
  locationFocusRequest = 0,
  interactionMode = 'full',
}: MapWrapperProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMapReady(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-full w-full">
      {mapReady ? (
        <ClubMap
          clubs={clubs}
          activeClubId={activeClubId}
          onSelectClub={onSelectClub}
          userLocation={userLocation}
          locationFocusRequest={locationFocusRequest}
          interactionMode={interactionMode}
        />
      ) : (
        <Skeleton className="h-full w-full rounded-none" />
      )}
    </div>
  );
}
