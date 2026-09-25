'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from '@/components/ui/Icon';
import { trackGaEvent } from '@/lib/google-analytics';
import { trackPostHogEvent } from '@/lib/posthog';

type PendingSearchAnalytics = {
  query: string;
  district: string | null;
  metro: string | null;
  clubType: string | null;
  priceMax: string | null;
  exploreView: 'list' | 'map';
};

const SEARCH_NAVIGATION_DEBOUNCE_MS = 300;
const SEARCH_ANALYTICS_SETTLE_MS = 1200;
const SEARCH_RESULT_READ_INTERVAL_MS = 100;
const SEARCH_RESULT_READ_TIMEOUT_MS = 10_000;

function readRenderedResultCount() {
  const explore = document.querySelector('[data-explore-view]');
  const rawCount = explore?.getAttribute('data-result-count') ?? '';
  const count = Number(rawCount);
  return Number.isInteger(count) && count >= 0 ? count : null;
}

export function SearchFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const paramsString = searchParams.toString();
  const currentQuery = searchParams.get('q') ?? '';
  const [value, setValue] = useState(currentQuery);
  const [pendingSearchAnalytics, setPendingSearchAnalytics] = useState<PendingSearchAnalytics | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastRequestedQueryRef = useRef(currentQuery);
  const lastTrackedQueryRef = useRef(currentQuery);
  const currentQueryRef = useRef(currentQuery);
  const paramsStringRef = useRef(paramsString);
  const navigationPending = value.trim() !== currentQuery;

  useEffect(() => {
    const focusSearch = () => {
      const searchContainer = document.getElementById('club-search');
      if (!searchContainer) return;

      searchContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    };

    const handleMobileSearchNavigation = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const searchLink = target?.closest<HTMLAnchorElement>('a[href="/#club-search"]');
      if (!searchLink || window.location.pathname !== '/') return;

      event.preventDefault();
      window.history.replaceState(window.history.state, '', '#club-search');
      focusSearch();
    };

    document.addEventListener('click', handleMobileSearchNavigation, true);
    if (window.location.hash === '#club-search') focusSearch();

    return () => document.removeEventListener('click', handleMobileSearchNavigation, true);
  }, []);

  useEffect(() => {
    currentQueryRef.current = currentQuery;
    paramsStringRef.current = paramsString;

    if (currentQuery === lastRequestedQueryRef.current) return;

    // A slower route response for an older query must never replace text the
    // user is still typing. Once the field is no longer active, URL changes
    // can safely become the source of truth again.
    if (document.activeElement === inputRef.current) return;

    lastRequestedQueryRef.current = currentQuery;
    lastTrackedQueryRef.current = currentQuery;
    setPendingSearchAnalytics(null);
    setValue(currentQuery);
  }, [currentQuery, paramsString]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = value.trim();
      const currentQueryAtDispatch = currentQueryRef.current;
      if (nextQuery === currentQueryAtDispatch || nextQuery === lastRequestedQueryRef.current) return;

      lastRequestedQueryRef.current = nextQuery;

      const params = new URLSearchParams(paramsStringRef.current);
      if (nextQuery) params.set('q', nextQuery);
      else params.delete('q');

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, SEARCH_NAVIGATION_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [value, pathname, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = value.trim();
      if (nextQuery === lastTrackedQueryRef.current) return;

      const params = new URLSearchParams(paramsStringRef.current);
      if (nextQuery) params.set('q', nextQuery);
      else params.delete('q');

      setPendingSearchAnalytics({
        query: nextQuery,
        district: params.get('district'),
        metro: params.get('metro'),
        clubType: params.get('type'),
        priceMax: params.get('price_max'),
        exploreView: params.get('view') === 'map' ? 'map' : 'list',
      });
    }, SEARCH_ANALYTICS_SETTLE_MS);

    return () => window.clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const pending = pendingSearchAnalytics;
    if (!pending || currentQuery !== pending.query) return;

    let retryTimer = 0;
    let cancelled = false;
    const startedAt = Date.now();

    const captureCommittedSearch = () => {
      if (cancelled || currentQueryRef.current !== pending.query) return;

      if (!pending.query) {
        lastTrackedQueryRef.current = '';
        setPendingSearchAnalytics(null);
        const clearedProperties = {
          search_query: null,
          search_query_length: 0,
          district: pending.district,
          metro: pending.metro,
          club_type: pending.clubType,
          price_max: pending.priceMax,
          explore_view: pending.exploreView,
        };
        trackGaEvent('search_cleared', {
          search_term: null,
          search_query_length: 0,
          district: pending.district,
          metro: pending.metro,
          club_type: pending.clubType,
          price_max: pending.priceMax,
          explore_view: pending.exploreView,
        });
        trackPostHogEvent('search_cleared', clearedProperties);
        return;
      }

      const resultCount = readRenderedResultCount();
      if (resultCount == null) {
        if (Date.now() - startedAt < SEARCH_RESULT_READ_TIMEOUT_MS) {
          retryTimer = window.setTimeout(captureCommittedSearch, SEARCH_RESULT_READ_INTERVAL_MS);
        }
        return;
      }

      lastTrackedQueryRef.current = pending.query;
      setPendingSearchAnalytics(null);
      const searchProperties = {
        search_query: pending.query,
        search_query_length: pending.query.length,
        district: pending.district,
        club_type: pending.clubType,
        price_max: pending.priceMax,
        explore_view: pending.exploreView,
        result_count: resultCount,
        no_results: resultCount === 0,
      };
      trackGaEvent('search_query', {
        search_term: pending.query,
        search_query_length: pending.query.length,
        district: pending.district,
        club_type: pending.clubType,
        price_max: pending.priceMax,
        explore_view: pending.exploreView,
        result_count: resultCount,
        no_results: resultCount === 0,
      });
      trackPostHogEvent('search_query', searchProperties);
    };

    retryTimer = window.setTimeout(captureCommittedSearch, 0);
    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [currentQuery, pendingSearchAnalytics]);

  return (
    <div className="relative w-full">
      <SearchIcon
        width={18}
        height={18}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
      />

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
        placeholder="Klub adı və ya ünvan axtar"
        aria-label="Klub axtar"
        enterKeyHint="search"
        autoComplete="off"
        className="h-12 w-full touch-manipulation rounded-xl border border-border-strong bg-surface pl-11 pr-20 text-base text-ink outline-none transition placeholder:text-faint hover:border-muted focus:border-primary focus:ring-2 focus:ring-primary/10 sm:text-sm lg:h-11"
      />

      {navigationPending && value ? (
        <span
          role="status"
          aria-label="Axtarılır"
          className="pointer-events-none absolute right-11 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-primary"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 animate-spin" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            <path d="M10 3a7 7 0 0 1 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      ) : null}

      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue('');
            window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
          }}
          aria-label="Axtarışı təmizlə"
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-xl leading-none text-faint transition hover:bg-surface-alt hover:text-ink"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
