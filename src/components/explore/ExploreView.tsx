'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClubWithRelations } from '@/types/database';
import { ClubList } from '@/components/clubs/ClubList';
import { MapErrorBoundary } from '@/components/map/MapErrorBoundary';
import { MapPreview } from '@/components/map/MapPreview';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useFilters } from '@/hooks/useFilters';
import { formatDistance, haversineDistanceKm } from '@/lib/geo';

const MapWrapper = dynamic(
  () => import('@/components/map/MapWrapper').then((module) => module.MapWrapper),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-surface-alt" aria-hidden="true" />,
  },
);

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
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [mobileListMapActive, setMobileListMapActive] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
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

  const mobileClubs = mobileExpanded ? clubsWithDistance : clubsWithDistance.slice(0, 4);

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
    if (nextLocation) setLocationFocusRequest((value) => value + 1);
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
            ? 'Yaxınlıq sırası'
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
            : 'Lokasiyam';

  const locationMessage = status === 'denied'
    ? 'Yaxın klubları görmək üçün brauzer ayarlarında GameYer üçün lokasiya icazəsini aktiv et.'
    : status === 'unavailable'
      ? 'Lokasiya alınmadı. GPS və internet bağlantısını yoxlayıb yenidən cəhd et.'
      : status === 'unsupported'
        ? 'Bu brauzer cihaz lokasiyasını dəstəkləmir.'
        : null;

  function renderMapPanel() {
    return (
      <div className="relative h-full min-h-0 overflow-hidden rounded-[18px] border border-border bg-surface-alt shadow-[0_8px_24px_rgba(31,35,48,0.05)]">
        <MapErrorBoundary>
          <MapWrapper
            clubs={clubsWithDistance}
            activeClubId={activeClubId}
            onSelectClub={handleSelectMarker}
            userLocation={location}
            locationFocusRequest={locationFocusRequest}
          />
        </MapErrorBoundary>

        <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-2">
          <div className="pointer-events-auto rounded-xl border border-border bg-surface/95 px-3 py-2 text-xs font-semibold text-ink shadow-card backdrop-blur">
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-live" aria-hidden="true" />
            Xəritədə {clubsWithDistance.length} klub
          </div>
        </div>

        <div className="absolute right-3 top-3 z-[500]">
          <button
            type="button"
            onClick={() => void handleMapLocation()}
            disabled={status === 'loading' || status === 'unsupported'}
            className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-surface/95 px-3 text-xs font-semibold text-ink shadow-card backdrop-blur transition hover:border-primary hover:text-primary disabled:opacity-60"
          >
            <span aria-hidden="true">⌖</span>
            <span className="hidden xl:inline">{mapLocationLabel}</span>
          </button>
        </div>

        {location && nearestClub?.distanceKm != null ? (
          <div className="absolute bottom-3 right-3 z-[500] max-w-[240px] rounded-xl border border-border bg-surface/95 px-3 py-2 text-right shadow-card backdrop-blur">
            <p className="text-[10px] text-muted">Ən yaxın klub</p>
            <p className="truncate text-xs font-semibold text-ink">{nearestClub.name}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-primary">{formatDistance(nearestClub.distanceKm)}</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="bg-surface"
      data-explore-view={view}
      data-mobile-map-active={view === 'map' || mobileListMapActive}
    >
      <div className="hidden h-[clamp(590px,68vh,660px)] min-h-0 grid-cols-[360px_minmax(0,1fr)] gap-3 lg:grid xl:grid-cols-[420px_minmax(0,1fr)] xl:gap-4 2xl:grid-cols-[450px_minmax(0,1fr)]">
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[18px] border border-border bg-bg-elevated">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3.5 py-3 xl:gap-3 xl:px-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink xl:text-base">Klublar ({clubsWithDistance.length})</p>
              <p className="mt-0.5 hidden text-[11px] text-muted xl:block">Klubu seç, xəritədə yerini gör</p>
            </div>
            <button
              type="button"
              onClick={handleLocationSort}
              disabled={status === 'loading' || status === 'unsupported'}
              className={`shrink-0 whitespace-nowrap rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition disabled:opacity-50 xl:px-3 xl:text-xs ${sortByDistance && location ? 'border-primary bg-pc-tint text-primary' : 'border-border bg-surface text-muted hover:border-primary hover:text-primary'}`}
            >
              {locationButtonLabel}
            </button>
          </div>
          {locationMessage ? <div className="mx-3 mt-3 rounded-xl border border-warn/30 bg-warn-tint px-3 py-2 text-xs text-ink">{locationMessage}</div> : null}
          <div className="min-h-0 flex-1 overflow-y-auto p-3 pr-2 [scrollbar-gutter:stable]">
            <ClubList
              clubs={clubsWithDistance}
              activeClubId={activeClubId}
              onHoverClub={handleHoverCard}
              cardRefs={cardRefs}
              searchActive={searchActive}
              onClearFilters={hasActiveFilters ? clearAll : undefined}
            />
          </div>
        </section>

        <section className="min-h-0 min-w-0 overflow-hidden rounded-[18px] bg-bg-elevated">
          {isDesktop === true ? renderMapPanel() : <div className="h-full animate-pulse rounded-[18px] bg-surface-alt" />}
        </section>
      </div>

      <div className="lg:hidden">
        {view === 'map' ? (
          <section className="h-[430px] overflow-hidden rounded-[18px] sm:h-[500px]">
            {isDesktop === false ? renderMapPanel() : <div className="h-full animate-pulse rounded-[18px] bg-surface-alt" />}
          </section>
        ) : null}

        {view === 'list' ? (
          <section>
            <div className="relative mb-3 h-[340px] overflow-hidden rounded-[18px] sm:h-[380px]">
              {mobileListMapActive && isDesktop === false ? renderMapPanel() : <MapPreview clubCount={clubsWithDistance.length} />}
              {!mobileListMapActive ? (
                <button
                  type="button"
                  aria-label="Xəritəni aktiv et"
                  onClick={() => setMobileListMapActive(true)}
                  className="absolute inset-0 z-[600] rounded-[18px] bg-transparent"
                >
                  <span className="sr-only">Xəritəni hərəkət etdirmək üçün toxun</span>
                </button>
              ) : null}
            </div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-ink">Klublar ({clubsWithDistance.length})</p>
                <p className="text-xs text-muted">Klubları müqayisə et</p>
              </div>
              <button
                type="button"
                onClick={handleLocationSort}
                disabled={status === 'loading' || status === 'unsupported'}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold ${sortByDistance && location ? 'border-primary bg-pc-tint text-primary' : 'border-border bg-surface text-muted'}`}
              >
                {locationButtonLabel}
              </button>
            </div>
            {locationMessage ? <div className="mb-3 rounded-xl border border-warn/30 bg-warn-tint px-3 py-2 text-xs text-ink">{locationMessage}</div> : null}
            <ClubList
              clubs={mobileClubs}
              activeClubId={activeClubId}
              onHoverClub={handleHoverCard}
              searchActive={searchActive}
              onClearFilters={hasActiveFilters ? clearAll : undefined}
            />
            {clubsWithDistance.length > 4 ? (
              <button
                type="button"
                onClick={() => setMobileExpanded((value) => !value)}
                className="mt-3 h-12 w-full rounded-xl border border-border bg-surface text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
              >
                {mobileExpanded ? 'Daha az klub göstər' : `Daha çox klub göstər (${clubsWithDistance.length - 4})`}
              </button>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
