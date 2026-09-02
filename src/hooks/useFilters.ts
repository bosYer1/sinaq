'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { ClubFilters } from '@/types/database';
import { trackPostHogEvent } from '@/lib/posthog';

export type ViewMode = 'list' | 'map';

function parsePositiveNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: ClubFilters = useMemo(() => ({
    district: searchParams.get('district') || undefined,
    type: searchParams.get('type') || undefined,
    priceMax: parsePositiveNumber(searchParams.get('price_max')),
    q: searchParams.get('q')?.trim() || undefined,
  }), [searchParams]);

  const view: ViewMode = searchParams.get('view') === 'map' ? 'map' : 'list';

  const updateParams = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === null) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setDistrict = useCallback((slug: string | undefined) => {
    trackPostHogEvent('filter_changed', { filter_name: 'district', filter_value: slug ?? null });
    updateParams({ district: slug });
  }, [updateParams]);

  const setType = useCallback((slug: string | undefined) => {
    trackPostHogEvent('filter_changed', { filter_name: 'club_type', filter_value: slug ?? null });
    updateParams({ type: slug });
  }, [updateParams]);

  const setPriceMax = useCallback((price: number | undefined) => {
    trackPostHogEvent('filter_changed', { filter_name: 'price_max', filter_value: price ?? null });
    updateParams({ price_max: price });
  }, [updateParams]);

  const setQuery = useCallback((q: string | undefined) => updateParams({ q: q?.trim() || undefined }), [updateParams]);

  const setView = useCallback((mode: ViewMode) => {
    trackPostHogEvent('explore_view_changed', { explore_view: mode });
    updateParams({ view: mode });
  }, [updateParams]);

  const clearAll = useCallback(() => {
    trackPostHogEvent('filters_cleared', {
      had_district: Boolean(filters.district),
      had_club_type: Boolean(filters.type),
      had_price_max: Boolean(filters.priceMax),
      had_search_query: Boolean(filters.q),
    });

    const params = new URLSearchParams();
    if (view === 'map') params.set('view', 'map');
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [filters.district, filters.priceMax, filters.q, filters.type, pathname, router, view]);

  const hasActiveFilters = Boolean(filters.district || filters.type || filters.priceMax || filters.q);

  return { filters, view, setDistrict, setType, setPriceMax, setQuery, setView, clearAll, hasActiveFilters };
}
