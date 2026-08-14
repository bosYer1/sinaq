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
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="w-full lg:max-w-[360px]">
            <SearchFilter />
          </div>

          <div
            className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 lg:flex-1 lg:overflow-visible"
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
