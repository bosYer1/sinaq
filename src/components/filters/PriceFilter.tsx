'use client';

import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

const PRICE_OPTIONS = [5, 10, 15, 20, 30];

export function PriceFilter() {
  const { filters, setPriceMax } = useFilters();

  return (
    <div className="relative">
      <select
        value={filters.priceMax ?? ''}
        onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
        className={cn(
          'h-9 appearance-none rounded-full border border-border bg-surface pl-3.5 pr-8 text-sm font-medium text-ink',
          'focus:border-primary focus:outline-none',
          filters.priceMax && 'border-primary text-primary-dark',
        )}
        aria-label="Maksimum qiymətə görə filtr"
      >
        <option value="">İstənilən qiymət</option>
        {PRICE_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p} AZN-ə qədər
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">▾</span>
    </div>
  );
}
