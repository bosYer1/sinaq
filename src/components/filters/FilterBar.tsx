'use client';

import type { District, ClubType } from '@/types/database';
import { SearchFilter } from './SearchFilter';
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
    <div className="shrink-0 border-b border-border bg-surface">
      <div className="w-full px-4 py-3 sm:px-6 lg:px-7">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
          
          {/* Mobile full width, desktop kompakt search */}
          <div className="w-full shrink-0 md:w-[380px] lg:w-[420px]">
            <SearchFilter />
          </div>

          <div
            className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5 md:overflow-visible md:pb-0"
            style={{ scrollbarWidth: 'none' }}
          >
            <TypeFilter types={types} />
            <DistrictFilter districts={districts} />
            <PriceFilter />

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="h-10 shrink-0 px-2 text-sm font-medium text-muted transition hover:text-ink"
              >
                Təmizlə
              </button>
            ) : null}

            <div className="ml-auto shrink-0">
              <ViewToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
