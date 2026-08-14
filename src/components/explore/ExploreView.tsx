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

export function ExploreView({
  clubs,
  view,
  searchActive,
}: ExploreViewProps) {
  const { location } = useUserLocation();

  const [activeClubId, setActiveClubId] = useState<string | null>(null);

  const cardRefs =
    useRef<Record<string, HTMLAnchorElement | null>>({});

  const clubsWithDistance = useMemo(
    () =>
      clubs.map((club) => ({
        ...club,

        distanceKm:
          location &&
          club.latitude != null &&
          club.longitude != null
            ? haversineDistanceKm(
                location.lat,
                location.lng,
                club.latitude,
                club.longitude
              )
            : null,
      })),
    [clubs, location]
  );

  function handleHoverCard(id: string) {
    setActiveClubId(id);
  }

  function handleSelectMarker(id: string) {
    setActiveClubId(id);

    cardRefs.current[id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-bg lg:flex-row">
      {/* CLUB LIST */}
      <section
        className={`min-h-0 w-full overflow-y-auto px-4 py-4 sm:px-6 lg:block lg:w-[400px] lg:shrink-0 xl:w-[420px] ${
          view === 'map' ? 'hidden' : 'block'
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">
            {clubsWithDistance.length} klub
          </p>

          <span className="text-xs text-muted">
            Bakı
          </span>
        </div>

        <ClubList
          clubs={clubsWithDistance}
          activeClubId={activeClubId}
          onHoverClub={handleHoverCard}
          cardRefs={cardRefs}
          searchActive={searchActive}
        />
      </section>

      {/* MAP PANEL */}
      <section
        className={`relative min-h-0 flex-1 bg-bg p-3 pt-0 lg:p-3 lg:pl-0 ${
          view === 'map' ? 'block' : 'hidden'
        } lg:block`}
      >
        <div className="h-full min-h-0 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-card">
          <MapWrapper
            clubs={clubsWithDistance}
            activeClubId={activeClubId}
            onSelectClub={handleSelectMarker}
          />
        </div>
      </section>
    </div>
  );
}
