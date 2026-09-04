'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from '@/components/ui/Icon';
import { trackPostHogEvent } from '@/lib/posthog';

type PendingSearchAnalytics = {
  query: string;
  district: string | null;
  clubType: string | null;
  priceMax: string | null;
  exploreView: 'list' | 'map';
};

const SEARCH_NAVIGATION_DEBOUNCE_MS = 300;
const SEARCH_ANALYTICS_SETTLE_MS = 1200;
const SEARCH_RESULT_READ_ATTEMPTS = 30;

function readRenderedResultCount() {
  const exploreText = document.querySelector('[data-explore-view]')?.textContent ?? '';
  const match = exploreText.match(/Klublar \((\d+)\)/);
  if (!match) return null;

  const count = Number(match[1]);
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

    let frame = 0;
    let attempts = 0;
    let cancelled = false;

    const captureCommittedSearch = () => {
      if (cancelled || currentQueryRef.current !== pending.query) return;

      if (!pending.query) {
        lastTrackedQueryRef.current = '';
        setPendingSearchAnalytics(null);
        trackPostHogEvent('search_cleared', {
          search_query: null,
          search_query_length: 0,
          district: pending.district,
          club_type: pending.clubType,
          price_max: pending.priceMax,
          explore_view: pending.exploreView,
        });
        return;
      }

      const resultCount = readRenderedResultCount();
      if (resultCount == null) {
        if (attempts < SEARCH_RESULT_READ_ATTEMPTS) {
          attempts += 1;
          frame = window.requestAnimationFrame(captureCommittedSearch);
        }
        return;
      }

      lastTrackedQueryRef.current = pending.query;
      setPendingSearchAnalytics(null);
      trackPostHogEvent('search_query', {
        search_query: pending.query,
        search_query_length: pending.query.length,
        district: pending.district,
        club_type: pending.clubType,
        price_max: pending.priceMax,
        explore_view: pending.exploreView,
        result_count: resultCount,
        no_results: resultCount === 0,
      });
    };

    frame = window.requestAnimationFrame(captureCommittedSearch);
    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
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
        placeholder="Klub adı və ya ünvan axtar"
        aria-label="Klub axtar"
        enterKeyHint="search"
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-border-strong bg-surface pl-11 pr-11 text-sm text-ink outline-none transition placeholder:text-faint hover:border-muted focus:border-primary focus:ring-2 focus:ring-primary/10 lg:h-11"
      />

      {value ? (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Axtarışı təmizlə"
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-xl leading-none text-faint transition hover:bg-surface-alt hover:text-ink"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
