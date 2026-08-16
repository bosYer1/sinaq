'use client';

import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';

  return (
    <div className="shrink-0 border-b border-border bg-surface/95 backdrop-blur">
      <div className="w-full px-4 py-3 sm:px-6 lg:px-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="w-full shrink-0 md:w-[380px] lg:w-[420px]">
            <SearchFilter key={searchQuery} />
          </div>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 md:flex md:flex-1">
            <div
              className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-1 md:overflow-visible md:pb-0"
              aria-label="Klub filtrləri"
            >
              <TypeFilter types={types} />
              <DistrictFilter districts={districts} />
              <PriceFilter />

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="h-10 shrink-0 rounded-control px-2 text-sm font-medium text-muted transition hover:bg-surface-alt hover:text-ink"
                >
                  Təmizlə
                </button>
              ) : null}
            </div>

            <div className="shrink-0 self-start md:self-auto">
              <ViewToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
