'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClubWithRelations } from '@/types/database';
import { ClubList } from '@/components/clubs/ClubList';
import { MapWrapper } from '@/components/map/MapWrapper';
import { MapErrorBoundary } from '@/components/map/MapErrorBoundary';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useFilters } from '@/hooks/useFilters';
import { formatDistance, haversineDistanceKm } from '@/lib/geo';

interface ExploreViewProps {
  clubs: ClubWithRelations[];
  view: 'list' | 'map';
  searchActive?: boolean;
}

export function ExploreView({ clubs, view, searchActive }: ExploreViewProps) {
  const { location, status, requestLocation } = useUserLocation();
  const { clearAll, hasActiveFilters } = useFilters();
  const [sortByDistance, setSortByDistance] = useState(false);
  const [locationFocusRequest, setLocationFocusRequest] = useState(0);
  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const cardRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  const clubsWithDistance = useMemo(() => {
    const enriched = clubs.map((club) => ({
      ...club,
      distanceKm:
        location && club.latitude != null && club.longitude != null
          ? haversineDistanceKm(location.lat, location.lng, club.latitude, club.longitude)
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

  const nearestClub = useMemo(() => {
    if (!location) return null;
    return [...clubsWithDistance]
      .filter((club) => club.distanceKm != null)
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))[0] ?? null;
  }, [clubsWithDistance, location]);

  function handleLocationSort() {
    if (location) {
      setSortByDistance((value) => !value);
      return;
    }
    setSortByDistance(true);
    void requestLocation();
  }

  async function handleMapLocation() {
    setSortByDistance(true);
    if (location) {
      setLocationFocusRequest((value) => value + 1);
      return;
    }

    const nextLocation = await requestLocation();
    if (nextLocation) {
      setLocationFocusRequest((value) => value + 1);
    }
  }

  function handleHoverCard(id: string) {
    setActiveClubId(id);
  }

  function handleSelectMarker(id: string) {
    setActiveClubId(id);
    cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const locationButtonLabel = status === 'loading'
    ? 'Lokasiya alınır...'
    : status === 'denied'
      ? 'Lokasiya bağlıdır'
      : status === 'unavailable'
        ? 'Yenidən yoxla'
        : status === 'unsupported'
          ? 'Lokasiya dəstəklənmir'
          : sortByDistance && location
            ? 'Yaxınlıq sırası aktivdir'
            : 'Yaxınlığıma görə';

  const mapLocationLabel = status === 'loading'
    ? 'Lokasiya alınır...'
    : status === 'denied'
      ? 'Lokasiyaya icazə ver'
      : status === 'unavailable'
        ? 'Lokasiyanı yenilə'
        : status === 'unsupported'
          ? 'Lokasiya dəstəklənmir'
          : location
            ? 'Mənim lokasiyam'
            : 'Yaxın klublar';

  const locationMessage = status === 'denied'
    ? 'Yaxın klubları görmək üçün brauzer ayarlarında GameYer üçün lokasiya icazəsini aktiv et.'
    : status === 'unavailable'
      ? 'Lokasiya alınmadı. GPS və internet bağlantısını yoxlayıb yenidən cəhd et.'
      : status === 'unsupported'
        ? 'Bu brauzer cihaz lokasiyasını dəstəkləmir.'
        : null;

  const shouldMountMap = view === 'map' || isDesktop;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-bg lg:flex-row">
      <section className={`min-h-0 w-full overflow-y-auto px-4 py-4 sm:px-6 lg:block lg:w-[400px] lg:shrink-0 xl:w-[420px] ${view === 'map' ? 'hidden' : 'block'}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{clubsWithDistance.length} klub</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLocationSort}
              disabled={status === 'loading' || status === 'unsupported'}
              className={`rounded-control border px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${sortByDistance && location ? 'border-primary bg-pc-tint text-primary' : 'border-border bg-surface text-muted hover:border-border-strong hover:text-ink'}`}
              title={status === 'denied' ? 'Brauzerdə lokasiya icazəsini aktiv et və yenidən yoxla.' : 'Lokasiyan yalnız yaxın klubları hesablamaq üçün istifadə olunur.'}
            >
              {locationButtonLabel}
            </button>
            <span className="text-xs text-muted">Bakı</span>
          </div>
        </div>
        {locationMessage ? <div role="status" className="mb-3 rounded-control border border-warn/30 bg-warn-tint px-3 py-2 text-xs leading-5 text-ink">{locationMessage}</div> : null}
        <ClubList
          clubs={clubsWithDistance}
          activeClubId={activeClubId}
          onHoverClub={handleHoverCard}
          cardRefs={cardRefs}
          searchActive={searchActive}
          onClearFilters={hasActiveFilters ? clearAll : undefined}
        />
      </section>

      <section className={`relative min-h-0 flex-1 bg-surface-alt p-2.5 sm:p-3 lg:bg-bg lg:p-3 ${view === 'map' ? 'block' : 'hidden'} lg:block`}>
        <div className="relative h-full min-h-0 overflow-hidden rounded-2xl border-2 border-border-strong bg-surface shadow-[0_8px_28px_rgba(20,22,28,0.12)] sm:rounded-xl sm:border lg:shadow-card">
          {shouldMountMap ? (
            <MapErrorBoundary>
              <MapWrapper clubs={clubsWithDistance} activeClubId={activeClubId} onSelectClub={handleSelectMarker} userLocation={location} locationFocusRequest={locationFocusRequest} />
            </MapErrorBoundary>
          ) : null}

          {shouldMountMap ? (
            <div className="absolute left-3 right-3 top-3 z-[500] flex items-start justify-between gap-2 sm:left-auto sm:right-3 sm:flex-col sm:items-end">
              <button
                type="button"
                onClick={() => void handleMapLocation()}
                disabled={status === 'loading' || status === 'unsupported'}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-control border border-border-strong bg-surface/95 px-3 text-xs font-semibold text-ink shadow-card backdrop-blur transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:px-3.5 sm:text-sm"
                title={status === 'denied' ? 'Brauzer ayarlarından lokasiya icazəsini aktiv et.' : 'Lokasiyanı göstər və sənə yaxın klubları tap.'}
                aria-label="Lokasiyamı xəritədə göstər və yaxın klubları tap"
              >
                <span aria-hidden="true" className="text-base">⌖</span>
                {mapLocationLabel}
              </button>

              {locationMessage ? (
                <div role="status" className="max-w-[55%] rounded-control border border-warn/30 bg-surface/95 px-2.5 py-2 text-right text-[10px] leading-4 text-ink shadow-card backdrop-blur sm:max-w-[270px] sm:px-3 sm:text-[11px]">{locationMessage}</div>
              ) : location && nearestClub?.distanceKm != null ? (
                <div className="min-w-0 max-w-[55%] rounded-control border border-border bg-surface/95 px-2.5 py-2 text-right shadow-card backdrop-blur sm:max-w-[260px] sm:px-3">
                  <p className="hidden text-[11px] font-medium text-muted sm:block">Ən yaxın klub</p>
                  <p className="truncate text-[11px] font-semibold text-ink sm:text-xs">{nearestClub.name}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-primary sm:text-[11px]">{formatDistance(nearestClub.distanceKm)}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
