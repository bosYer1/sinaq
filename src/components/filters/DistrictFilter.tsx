'use client';

import type { District } from '@/types/database';
import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

export function DistrictFilter({ districts }: { districts: District[] }) {
  const { filters, setDistrict } = useFilters();

  return (
    <div className="relative">
      <select
        value={filters.district ?? ''}
        onChange={(e) => setDistrict(e.target.value || undefined)}
        className={cn(
          'h-10 appearance-none rounded-lg border border-border bg-surface pl-3 pr-7 text-sm text-ink md:h-9',
          'focus:border-primary focus:outline-none',
          filters.district && 'border-primary/50 bg-primary-light text-primary-dark',
        )}
        aria-label="Rayona görə filtr"
      >
        <option value="">Bütün rayonlar</option>
        {districts.map((d) => (
          <option key={d.id} value={d.slug}>
            {d.name}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted">
        <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
