'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { ClubFilters } from '@/types/database';

export type ViewMode = 'list' | 'map';

/**
 * Filtr vəziyyətini URL query params üzərindən oxuyan/yazan hook.
 *
 * Niyə URL-də saxlanılır (Zustand/Redux əvəzinə)?
 * - Filtr edilmiş nəticə linki paylaşıla bilər
 * - Brauzerin "geri" düyməsi filtri düzgün geri qaytarır
 * - Server component (page.tsx) səhifəni bu parametrlərlə birbaşa render edə bilir
 */
export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: ClubFilters = useMemo(() => {
    const priceMaxRaw = searchParams.get('price_max');
    return {
      district: searchParams.get('district') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      priceMax: priceMaxRaw ? Number(priceMaxRaw) : undefined,
      q: searchParams.get('q') ?? undefined,
    };
  }, [searchParams]);

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

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setDistrict = useCallback((slug: string | undefined) => updateParams({ district: slug }), [updateParams]);
  const setType = useCallback((slug: string | undefined) => updateParams({ type: slug }), [updateParams]);
  const setPriceMax = useCallback((price: number | undefined) => updateParams({ price_max: price }), [updateParams]);
  const setQuery = useCallback((q: string | undefined) => updateParams({ q }), [updateParams]);
  const setView = useCallback((mode: ViewMode) => updateParams({ view: mode }), [updateParams]);

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  const hasActiveFilters = Boolean(filters.district || filters.type || filters.priceMax || filters.q);

  return { filters, view, setDistrict, setType, setPriceMax, setQuery, setView, clearAll, hasActiveFilters };
}
