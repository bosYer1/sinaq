'use client';

import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

const PRICE_OPTIONS = [5, 10, 15, 20, 30];

export function PriceFilter() {
  const { filters, setPriceMax } = useFilters();

  return (
    <div className="relative shrink-0">
      <select
        value={filters.priceMax ?? ''}
        onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
        className={cn(
          'h-10 appearance-none rounded-xl border border-border bg-surface pl-3 pr-8 text-sm text-ink transition md:h-9',
          'hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10',
          filters.priceMax && 'border-primary/45 bg-primary/10 text-[#D7CAFF]',
        )}
        aria-label="Maksimum qiymətə görə filtr"
      >
        <option value="">İstənilən qiymət</option>
        {PRICE_OPTIONS.map((p) => <option key={p} value={p}>{p} AZN-ə qədər</option>)}
      </select>
      <svg viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted">
        <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
