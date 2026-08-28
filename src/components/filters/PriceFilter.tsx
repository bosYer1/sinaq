'use client';

import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

const PRICE_OPTIONS = [2, 3, 4, 5, 10, 15];

export function PriceFilter() {
  const { filters, setPriceMax } = useFilters();

  return (
    <div className="relative">
      <select
        value={filters.priceMax ?? ''}
        onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
        className={cn(
          'h-10 appearance-none rounded-lg border border-border bg-surface pl-3 pr-7 text-sm text-ink md:h-9',
          'focus:border-primary focus:outline-none',
          filters.priceMax && 'border-primary/50 bg-primary-light text-primary-dark',
        )}
        aria-label="Maksimum saatlıq qiymətə görə filtr"
      >
        <option value="">İstənilən qiymət</option>
        {PRICE_OPTIONS.map((p) => (
          <option key={p} value={p}>
            Saatlıq {p} AZN-ə qədər
          </option>
        ))}
      </select>
      <svg viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted">
        <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
