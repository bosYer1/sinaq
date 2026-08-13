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
          'h-9 appearance-none rounded-full border border-border bg-surface pl-3.5 pr-8 text-sm font-medium text-ink',
          'focus:border-primary focus:outline-none',
          filters.district && 'border-primary text-primary-dark',
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
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">▾</span>
    </div>
  );
}
