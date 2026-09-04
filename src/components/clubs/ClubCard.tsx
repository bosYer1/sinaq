'use client';

import { forwardRef, useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import type { ClubWithDistance } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { ClubLogo } from '@/components/clubs/ClubLogo';
import { MapPinIcon } from '@/components/ui/Icon';
import { rememberClubEntryOrigin } from '@/components/clubs/BackToClubsLink';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { getPlatformStartingPrices } from '@/lib/pricing';
import { cn, formatPriceRange, isClubOpenNow, isPremiumActive } from '@/lib/utils';
import { formatDistance } from '@/lib/geo';
import { trackGaEvent } from '@/lib/google-analytics';
import { clubCardClickEvent, trackMetaCustomEvent } from '@/lib/meta-pixel';
import { trackPostHogEvent } from '@/lib/posthog';

interface ClubCardProps {
  club: ClubWithDistance;
  listPosition: number;
  active?: boolean;
  onMouseEnter?: () => void;
  imagePriority?: boolean;
}

type LiveState = {
  openNow: boolean;
  premiumActive: boolean;
};

type DiscoverySurface = 'explore_list' | 'search_results' | 'filtered_list';

type DiscoveryContext = {
  source_surface: DiscoverySurface;
  explore_view: 'list' | 'map';
  search_active: boolean;
  club_type_filter: string | null;
  district_filter: string | null;
  price_max_filter: number | null;
};

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function currentDiscoveryContext(): DiscoveryContext {
  const params = new URLSearchParams(window.location.search);
  const searchActive = Boolean(params.get('q')?.trim());
  const clubTypeFilter = params.get('type') || null;
  const districtFilter = params.get('district') || null;
  const rawPriceMax = params.get('price_max');
  const parsedPriceMax = rawPriceMax ? Number(rawPriceMax) : Number.NaN;
  const priceMaxFilter = Number.isFinite(parsedPriceMax) && parsedPriceMax > 0 ? parsedPriceMax : null;
  const hasStructuredFilter = Boolean(clubTypeFilter || districtFilter || priceMaxFilter != null);

  return {
    source_surface: searchActive ? 'search_results' : hasStructuredFilter ? 'filtered_list' : 'explore_list',
    explore_view: params.get('view') === 'map' ? 'map' : 'list',
    search_active: searchActive,
    club_type_filter: clubTypeFilter,
    district_filter: districtFilter,
    price_max_filter: priceMaxFilter,
  };
}

export const ClubCard = forwardRef<HTMLAnchorElement, ClubCardProps>(function ClubCard({ club, listPosition, active, onMouseEnter, imagePriority = false }, ref) {
  const isVerified = club.is_verified;
  const hasHours = club.opening_hours.length > 0;
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const cardElementRef = useRef<HTMLAnchorElement | null>(null);
  const clubHref = `/klub/${encodeURIComponent(club.slug)}`;

  useEffect(() => {
    const refreshLiveState = () => {
      setLiveState({
        openNow: hasHours ? isClubOpenNow(club.opening_hours) : false,
        premiumActive: isPremiumActive(club),
      });
    };
    refreshLiveState();
    const timer = window.setInterval(refreshLiveState, 60_000);
    return () => window.clearInterval(timer);
  }, [club, hasHours]);

  useEffect(() => {
    const element = cardElementRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    let captured = false;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting || entry.intersectionRatio < 0.6 || captured) return;
      captured = true;
      trackPostHogEvent('club_impression', {
        club_id: club.id,
        club_slug: club.slug,
        club_name: club.name,
        district: club.district?.name ?? null,
        list_position: listPosition,
        is_verified: Boolean(club.is_verified),
        has_profile_image: Boolean(club.profile_image_url),
        image_count: club.images.length,
        has_pricing: club.pricing.length > 0,
        has_hours: hasHours,
        ...currentDiscoveryContext(),
      });
      observer.disconnect();
    }, { threshold: [0.6] });

    observer.observe(element);
    return () => observer.disconnect();
  }, [club.district?.name, club.id, club.images.length, club.is_verified, club.name, club.pricing.length, club.profile_image_url, club.slug, hasHours, listPosition]);

  const openNow = liveState?.openNow ?? false;
  const premiumActive = liveState?.premiumActive ?? false;
  const statusLabel = !hasHours ? 'Saat məlum deyil' : liveState === null ? 'Yoxlanılır' : openNow ? 'Açıqdır' : 'Bağlıdır';
  const typeSlugs = inferClubTypeSlugs(club);
  const startingPrices = getPlatformStartingPrices(club.pricing);

  function setCardRef(element: HTMLAnchorElement | null) {
    cardElementRef.current = element;
    if (typeof ref === 'function') ref(element);
    else if (ref) ref.current = element;
  }

  function trackClubCardClick(event: MouseEvent<HTMLAnchorElement>) {
    rememberClubEntryOrigin(club.slug);

    const eventProperties = {
      club_id: club.id,
      club_slug: club.slug,
      club_name: club.name,
      district: club.district?.name ?? null,
      list_position: listPosition,
      ...currentDiscoveryContext(),
    };
    const isMobileHardNavigation = isPlainLeftClick(event) && window.matchMedia('(max-width: 1023px)').matches;

    trackMetaCustomEvent(clubCardClickEvent({
      clubId: club.id,
      clubSlug: club.slug,
      clubName: club.name,
      district: club.district?.name ?? null,
    }));
    trackGaEvent('club_card_click', eventProperties);
    trackPostHogEvent(
      'club_card_click',
      eventProperties,
      isMobileHardNavigation ? { send_instantly: true, transport: 'sendBeacon' } : undefined,
    );

    // Mobile browser Back can restore a stale App Router snapshot after opening
    // a club from the expanded list. Use a real document navigation on mobile
    // so returning restores a clean interactive page. ExploreView persists the
    // expanded-list state and scroll position separately.
    if (isMobileHardNavigation) {
      event.preventDefault();
      window.location.assign(clubHref);
    }
  }

  return (
    <Link
      ref={setCardRef}
      href={clubHref}
      onMouseEnter={onMouseEnter}
      onFocus={onMouseEnter}
      onClick={trackClubCardClick}
      className={cn(
        'group flex min-h-[112px] gap-3 rounded-xl border bg-surface p-3 transition-all duration-150',
        active
          ? 'border-primary shadow-[0_8px_22px_rgba(124,92,252,0.12)] ring-1 ring-primary/10'
          : 'border-border shadow-[0_4px_14px_rgba(31,35,48,0.04)] hover:border-primary/35 hover:shadow-[0_8px_22px_rgba(31,35,48,0.08)]',
      )}
    >
      <div className="relative h-[88px] w-[104px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-pc-tint to-ps-tint ring-1 ring-border sm:w-[112px]">
        <ClubLogo
          slug={club.slug}
          name={club.name}
          profileImageUrl={club.profile_image_url}
          className="h-full w-full rounded-lg border-0 bg-transparent text-3xl"
          priority={imagePriority}
        />
        {hasHours && liveState !== null ? (
          <span className={cn('absolute left-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-white', openNow ? 'bg-live' : 'bg-red-500')} title={statusLabel} />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate font-display text-[15px] font-bold tracking-[-0.01em] text-ink transition group-hover:text-primary">{club.name}</h3>
          <div className="flex shrink-0 items-center gap-1">
            {isVerified ? <Badge tone="verified">✓</Badge> : null}
            {liveState !== null && premiumActive ? <Badge tone="premium">VIP</Badge> : null}
          </div>
        </div>

        <div className="mt-1 flex min-w-0 items-center gap-1 text-[11px] text-muted">
          <MapPinIcon width={13} height={13} className="shrink-0" />
          <span className="truncate">{club.district?.name ?? 'Rayon göstərilməyib'}{club.address ? ` · ${club.address}` : ''}</span>
        </div>

        {typeSlugs.length > 0 ? (
          <div className="mt-1.5 flex min-w-0 items-center gap-1 overflow-hidden">
            {typeSlugs.map((slug) => <Badge key={slug} tone={slug === 'pc' ? 'pc' : 'ps'}>{slug === 'pc' ? 'PC' : 'PlayStation'}</Badge>)}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div className="min-w-0 space-y-0.5">
            {startingPrices.pc ? (
              <div className="truncate text-[11px] font-bold text-live">PC: {formatPriceRange(startingPrices.pc.price_from, null, startingPrices.pc.unit)}</div>
            ) : null}
            {startingPrices.playstation ? (
              <div className="truncate text-[11px] font-bold text-live">PS: {formatPriceRange(startingPrices.playstation.price_from, null, startingPrices.playstation.unit)}</div>
            ) : null}
            {!startingPrices.pc && !startingPrices.playstation ? (
              <div className="text-[10px] text-muted">Qiymət məlum deyil</div>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            {club.distanceKm != null ? <div className="text-[10px] font-medium text-primary">{formatDistance(club.distanceKm)}</div> : null}
            <div className={cn('mt-0.5 text-[10px] font-semibold', !hasHours || liveState === null ? 'text-muted' : openNow ? 'text-live' : 'text-red-500')}>{statusLabel}</div>
          </div>
        </div>
      </div>
    </Link>
  );
});
