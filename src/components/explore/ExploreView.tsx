'use client';

import { useMemo, useRef, useState } from 'react';
import type { ClubWithRelations } from '@/types/database';
import { ClubList } from '@/components/clubs/ClubList';
import { MapWrapper } from '@/components/map/MapWrapper';
import { useUserLocation } from '@/hooks/useUserLocation';
import { formatDistance, haversineDistanceKm } from '@/lib/geo';

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
  const { location, status, requestLocation } = useUserLocation();
  const [sortByDistance, setSortByDistance] = useState(false);
  const [locationFocusRequest, setLocationFocusRequest] = useState(0);
  const [activeClubId, setActiveClubId] = useState<string | null>(null);

  const cardRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const clubsWithDistance = useMemo(() => {
    const enriched = clubs.map((club) => ({
      ...club,
      distanceKm:
        location && club.latitude != null && club.longitude != null
          ? haversineDistanceKm(
              location.lat,
              location.lng,
              club.latitude,
              club.longitude
            )
          : null,
    }));

    if (!sortByDistance || !location) return enriched;

    return [...enriched].sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [clubs, location, sortByDistance]);

  const nearestClub = useMemo(
    () =>
      location
        ? clubsWithDistance.find((club) => club.distanceKm != null) ?? null
        : null,
    [clubsWithDistance, location]
  );

  function handleLocationSort() {
    if (location) {
      setSortByDistance((value) => !value);
      return;
    }

    setSortByDistance(true);
    requestLocation();
  }

  function handleMapLocation() {
    setSortByDistance(true);
    setLocationFocusRequest((value) => value + 1);

    if (!location) {
      requestLocation();
    }
  }

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

  const locationButtonLabel =
    status === 'loading'
      ? 'Lokasiya alınır...'
      : status === 'denied'
        ? 'Lokasiya bağlıdır'
        : sortByDistance && location
          ? 'Yaxınlıq sırası aktivdir'
          : 'Yaxınlığıma görə';

  const mapLocationLabel =
    status === 'loading'
      ? 'Konum alınır...'
      : status === 'denied'
        ? 'Konuma icazə ver'
        : location
          ? 'Mənim konumum'
          : 'Yaxın klublar';

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-bg lg:flex-row">
      <section
        className={`min-h-0 w-full overflow-y-auto px-4 py-4 sm:px-6 lg:block lg:w-[400px] lg:shrink-0 xl:w-[420px] ${
          view === 'map' ? 'hidden' : 'block'
        }`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">
            {clubsWithDistance.length} klub
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLocationSort}
              disabled={status === 'loading' || status === 'unsupported'}
              className={`rounded-control border px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                sortByDistance && location
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-border bg-surface text-muted hover:border-border-strong hover:text-ink'
              }`}
              title={
                status === 'denied'
                  ? 'Brauzerdə lokasiya icazəsini aktiv et və yenidən yoxla.'
                  : 'Lokasiyan yalnız yaxın klubları hesablamaq üçün istifadə olunur.'
              }
            >
              {locationButtonLabel}
            </button>
            <span className="text-xs text-muted">Bakı</span>
          </div>
        </div>

        <ClubList
          clubs={clubsWithDistance}
          activeClubId={activeClubId}
          onHoverClub={handleHoverCard}
          cardRefs={cardRefs}
          searchActive={searchActive}
        />
      </section>

      <section
        className={`relative min-h-0 flex-1 bg-surface-alt p-2.5 sm:p-3 lg:bg-bg lg:p-3 lg:pl-0 ${
          view === 'map' ? 'block' : 'hidden'
        } lg:block`}
      >
        <div className="relative h-full min-h-0 overflow-hidden rounded-2xl border-2 border-border-strong bg-surface shadow-[0_8px_28px_rgba(20,22,28,0.12)] sm:rounded-xl sm:border lg:shadow-card">
          <MapWrapper
            clubs={clubsWithDistance}
            activeClubId={activeClubId}
            onSelectClub={handleSelectMarker}
            userLocation={location}
            locationFocusRequest={locationFocusRequest}
          />

          <div className="absolute right-3 top-3 z-[500] flex max-w-[calc(100%-24px)] flex-col items-end gap-2 sm:right-3 sm:top-3">
            <button
              type="button"
              onClick={handleMapLocation}
              disabled={status === 'loading' || status === 'unsupported'}
              className="inline-flex h-11 items-center gap-2 rounded-control border border-border-strong bg-surface/95 px-3.5 text-sm font-semibold text-ink shadow-card backdrop-blur transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              title={
                status === 'denied'
                  ? 'Brauzer ayarlarından lokasiya icazəsini aktiv et.'
                  : 'Konumunu göstər və sənə yaxın klubları tap.'
              }
            >
              <span aria-hidden="true" className="text-base">⌖</span>
              {mapLocationLabel}
            </button>

            {location && nearestClub?.distanceKm != null ? (
              <div className="max-w-[240px] rounded-control border border-border bg-surface/95 px-3 py-2 text-right shadow-card backdrop-blur sm:max-w-[260px]">
                <p className="text-[11px] font-medium text-muted">Ən yaxın klub</p>
                <p className="truncate text-xs font-semibold text-ink">{nearestClub.name}</p>
                <p className="mt-0.5 text-[11px] font-medium text-primary">
                  {formatDistance(nearestClub.distanceKm)} məsafədə
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
