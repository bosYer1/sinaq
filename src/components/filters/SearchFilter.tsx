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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastRequestedQueryRef = useRef(currentQuery);
  const currentQueryRef = useRef(currentQuery);
  const paramsStringRef = useRef(paramsString);
  const pendingSearchAnalyticsRef = useRef<PendingSearchAnalytics | null>(null);

  useEffect(() => {
    currentQueryRef.current = currentQuery;
    paramsStringRef.current = paramsString;

    if (currentQuery === lastRequestedQueryRef.current) return;

    // A slower route response for an older query must never replace text the
    // user is still typing. Once the field is no longer active, URL changes
    // can safely become the source of truth again.
    if (document.activeElement === inputRef.current) return;

    lastRequestedQueryRef.current = currentQuery;
    setValue(currentQuery);
  }, [currentQuery, paramsString]);

  useEffect(() => {
    const pending = pendingSearchAnalyticsRef.current;
    if (!pending || !currentQuery || pending.query !== currentQuery) return;

    let frame = 0;
    let attempts = 0;
    let cancelled = false;

    const captureCommittedSearch = () => {
      if (cancelled) return;

      const resultCount = readRenderedResultCount();
      if (resultCount == null) {
        if (attempts < 12) {
          attempts += 1;
          frame = window.requestAnimationFrame(captureCommittedSearch);
        }
        return;
      }

      pendingSearchAnalyticsRef.current = null;
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
  }, [currentQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = value.trim();
      const currentQueryAtDispatch = currentQueryRef.current;
      if (nextQuery === currentQueryAtDispatch || nextQuery === lastRequestedQueryRef.current) return;

      lastRequestedQueryRef.current = nextQuery;

      const params = new URLSearchParams(paramsStringRef.current);
      if (nextQuery) params.set('q', nextQuery);
      else params.delete('q');

      const searchContext = {
        district: params.get('district'),
        clubType: params.get('type'),
        priceMax: params.get('price_max'),
        exploreView: params.get('view') === 'map' ? 'map' as const : 'list' as const,
      };

      if (nextQuery) {
        pendingSearchAnalyticsRef.current = {
          query: nextQuery,
          ...searchContext,
        };
      } else {
        pendingSearchAnalyticsRef.current = null;
        trackPostHogEvent('search_cleared', {
          search_query: null,
          search_query_length: 0,
          district: searchContext.district,
          club_type: searchContext.clubType,
          price_max: searchContext.priceMax,
          explore_view: searchContext.exploreView,
        });
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [value, pathname, router]);

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
