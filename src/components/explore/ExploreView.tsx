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

/**
 * Siyahı + xəritə panellərini birləşdirən client komponent.
 * Məsuliyyətləri:
 * - İstifadəçinin brauzer məkanını (icazə verilibsə) oxuyub hər klub üçün məsafə hesablamaq
 * - Kart hover-i ↔ marker highlight/fly-to əlaqəsini saxlamaq
 * - Marker klikini ↔ uyğun kartın scroll-into-view/highlight ilə əlaqələndirmək
 */
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
    // Yalnız desktop-da hər iki panel eyni anda göründüyü üçün scroll effektlidir
    cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return (
    <div className="flex min-h-0 flex-1 lg:flex-row">
      {/* Siyahı paneli: mobil-də yalnız view=list olanda görünür, desktop-da həmişə */}
      <section
        className={`min-h-0 w-full overflow-y-auto px-4 py-4 sm:px-6 lg:block lg:w-[420px] lg:shrink-0 lg:border-r lg:border-border ${
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

      {/* Xəritə paneli: mobil-də yalnız view=map olanda görünür, desktop-da sticky sağ panel */}
      <section className={`min-h-0 flex-1 ${view === 'map' ? 'block' : 'hidden'} lg:block`}>
        <MapWrapper clubs={clubsWithDistance} activeClubId={activeClubId} onSelectClub={handleSelectMarker} />
      </section>
    </div>
  );
}
