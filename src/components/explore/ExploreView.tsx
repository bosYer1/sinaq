'use client';

import { useMemo, useRef, useState } from 'react';
import type { ClubWithRelations } from '@/types/database';
import { ClubList } from '@/components/clubs/ClubList';
import { MapWrapper } from '@/components/map/MapWrapper';
import { useUserLocation } from '@/hooks/useUserLocation';
import { haversineDistanceKm } from '@/lib/geo';

interface ExploreViewProps {
  clubs: ClubWithRelations[];
  view: 'list' | 'map';
  searchActive?: boolean;
}

export function ExploreView({ clubs, view, searchActive }: ExploreViewProps) {
  const { location } = useUserLocation();
  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const clubsWithDistance = useMemo(
    () =>
      clubs.map((club) => ({
        ...club,
        distanceKm:
          location && club.latitude != null && club.longitude != null
            ? haversineDistanceKm(location.lat, location.lng, club.latitude, club.longitude)
            : null,
      })),
    [clubs, location],
  );

  function handleHoverCard(id: string) {
    setActiveClubId(id);
  }

  function handleSelectMarker(id: string) {
    setActiveClubId(id);
    cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return (
    <div className="flex h-full min-h-0 flex-1 lg:flex-row">
      <section
        className={`h-full min-h-0 w-full overflow-y-auto px-4 py-4 sm:px-6 lg:block lg:w-[380px] lg:shrink-0 lg:border-r lg:border-border ${
          view === 'map' ? 'hidden' : 'block'
        }`}
      >
        <p className="mb-3 text-sm text-muted">{clubsWithDistance.length} klub tapıldı</p>
        <ClubList
          clubs={clubsWithDistance}
          activeClubId={activeClubId}
          onHoverClub={handleHoverCard}
          cardRefs={cardRefs}
          searchActive={searchActive}
        />
      </section>

      <section className={`h-full min-h-0 flex-1 ${view === 'map' ? 'block' : 'hidden'} lg:block`}>
        <MapWrapper clubs={clubsWithDistance} activeClubId={activeClubId} onSelectClub={handleSelectMarker} />
      </section>
    </div>
  );
}
