'use client';

import type { District, ClubType } from '@/types/database';
import { DistrictFilter } from './DistrictFilter';
import { TypeFilter } from './TypeFilter';
import { PriceFilter } from './PriceFilter';
import { SearchFilter } from './SearchFilter';
import { ViewToggle } from './ViewToggle';
import { useFilters } from '@/hooks/useFilters';

interface FilterBarProps {
  districts: District[];
  types: ClubType[];
}

export function FilterBar({ districts, types }: FilterBarProps) {
  const { hasActiveFilters, clearAll } = useFilters();

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex items-center gap-2 px-4 pt-2 sm:px-6 lg:hidden">
        <SearchFilter />
        <div className="shrink-0">
          <ViewToggle />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6" style={{ scrollbarWidth: 'none' }}>
        <div className="hidden shrink-0 lg:block lg:w-64">
          <SearchFilter />
        </div>
        <div className="hidden h-6 w-px shrink-0 bg-border lg:block" />
        <TypeFilter types={types} />
        <div className="h-6 w-px shrink-0 bg-border" />
        <DistrictFilter districts={districts} />
        <PriceFilter />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 text-sm font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Təmizlə
          </button>
        )}
      </div>
    </div>
  );
}
