'use client';

import type { District, ClubType } from '@/types/database';
import { DistrictFilter } from './DistrictFilter';
import { TypeFilter } from './TypeFilter';
import { PriceFilter } from './PriceFilter';
import { ViewToggle } from './ViewToggle';
import { useFilters } from '@/hooks/useFilters';

interface FilterBarProps {
  districts: District[];
  types: ClubType[];
}

export function FilterBar({ districts, types }: FilterBarProps) {
  const { hasActiveFilters, clearAll } = useFilters();

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6" style={{ scrollbarWidth: 'none' }}>
        <TypeFilter types={types} />
        <DistrictFilter districts={districts} />
        <PriceFilter />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 text-sm font-medium text-muted hover:text-ink"
          >
            Təmizlə
          </button>
        )}
        <div className="ml-auto shrink-0">
          <ViewToggle />
        </div>
      </div>
    </div>
  );
}
