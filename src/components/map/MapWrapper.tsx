'use client';

import type { ClubWithDistance } from '@/types/database';
import type { UserLocation } from '@/hooks/useUserLocation';
import { ClubMap } from './ClubMap';

interface MapWrapperProps {
  clubs: ClubWithDistance[];
  activeClubId?: string | null;
  onSelectClub?: (id: string) => void;
  userLocation?: UserLocation | null;
  locationFocusRequest?: number;
}

export function MapWrapper({
  clubs,
  activeClubId,
  onSelectClub,
  userLocation,
  locationFocusRequest = 0,
}: MapWrapperProps) {
  return (
    <div className="relative h-full w-full">
      <ClubMap
        clubs={clubs}
        activeClubId={activeClubId}
        onSelectClub={onSelectClub}
        userLocation={userLocation}
        locationFocusRequest={locationFocusRequest}
      />
    </div>
  );
}
