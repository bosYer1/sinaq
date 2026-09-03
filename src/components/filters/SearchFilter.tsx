'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from '@/components/ui/Icon';
import { trackPostHogEvent } from '@/lib/posthog';

const SEARCH_ANALYTICS_SETTLE_MS = 1500;

export function SearchFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const paramsString = searchParams.toString();
  const currentQuery = searchParams.get('q') ?? '';
  const [value, setValue] = useState(currentQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastRequestedQueryRef = useRef(currentQuery);
  const lastTrackedQueryRef = useRef(currentQuery);
  const currentQueryRef = useRef(currentQuery);
  const paramsStringRef = useRef(paramsString);

  const trackSearchIntent = useCallback((rawQuery: string) => {
    const nextQuery = rawQuery.trim();
    if (!nextQuery || nextQuery === lastTrackedQueryRef.current) return;

    const params = new URLSearchParams(paramsStringRef.current);
    params.set('q', nextQuery);
    lastTrackedQueryRef.current = nextQuery;

    trackPostHogEvent('search_query', {
      search_query: nextQuery,
      search_query_length: nextQuery.length,
      district: params.get('district'),
      club_type: params.get('type'),
      price_max: params.get('price_max'),
      explore_view: params.get('view') === 'map' ? 'map' : 'list',
    });
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
    setValue(currentQuery);
  }, [currentQuery, paramsString]);

  useEffect(() => {
    const nextQuery = value.trim();
    if (!nextQuery || nextQuery === lastTrackedQueryRef.current) return;

    const timer = window.setTimeout(() => {
      trackSearchIntent(nextQuery);
    }, SEARCH_ANALYTICS_SETTLE_MS);

    return () => window.clearTimeout(timer);
  }, [value, trackSearchIntent]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = value.trim();
      const currentQueryAtDispatch = currentQueryRef.current;
      if (nextQuery === currentQueryAtDispatch || nextQuery === lastRequestedQueryRef.current) return;

      lastRequestedQueryRef.current = nextQuery;

      const params = new URLSearchParams(paramsStringRef.current);
      if (nextQuery) params.set('q', nextQuery);
      else params.delete('q');

      if (!nextQuery && currentQueryAtDispatch) {
        lastTrackedQueryRef.current = '';
        trackPostHogEvent('search_cleared', {
          search_query: null,
          search_query_length: 0,
          district: params.get('district'),
          club_type: params.get('type'),
          price_max: params.get('price_max'),
          explore_view: params.get('view') === 'map' ? 'map' : 'list',
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
        onBlur={(event) => trackSearchIntent(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          trackSearchIntent(event.currentTarget.value);
          event.currentTarget.blur();
        }}
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
