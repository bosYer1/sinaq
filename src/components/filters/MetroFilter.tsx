'use client';

import type { MetroStation } from '@/lib/metro';
import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

export function MetroFilter({ stations }: { stations: MetroStation[] }) {
  const { filters, setMetro } = useFilters();

  return (
    <div className="relative shrink-0">
      <select
        value={filters.metro ?? ''}
        onChange={(event) => setMetro(event.target.value || undefined)}
        className={cn(
          'h-10 min-w-[112px] appearance-none rounded-lg border border-border bg-surface pl-3 pr-7 text-sm text-ink md:h-9',
          'focus:border-primary focus:outline-none',
          filters.metro && 'border-primary/50 bg-primary/10 text-primary-dark',
        )}
        aria-label="Metroya görə filtr"
        title="Klubun ən yaxın metrosu — 2 km-dək"
      >
        <option value="">Metro</option>
        {stations.map((station) => (
          <option key={station.slug} value={station.slug}>
            {station.name}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted">
        <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
