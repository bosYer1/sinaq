'use client';

import { useSearchParams } from 'next/navigation';
import type { District, ClubType } from '@/types/database';
import { SearchFilter } from './SearchFilter';
import { DistrictFilter } from './DistrictFilter';
import { TypeFilter } from './TypeFilter';
import { PriceFilter } from './PriceFilter';
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
    <div id="club-search" className="mb-3 scroll-mt-20 rounded-2xl border border-border bg-surface p-2.5 shadow-[0_6px_24px_rgba(31,35,48,0.04)] sm:mb-4 sm:p-4">
      <div className="grid gap-2.5 xl:grid-cols-[minmax(300px,1.35fr)_minmax(0,2fr)_auto] xl:items-center xl:gap-3">
        <SearchFilter key={searchQuery} />

        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:overflow-visible xl:pb-0" aria-label="Klub filtrləri">
          <TypeFilter types={types} />
          <DistrictFilter districts={districts} />
          <PriceFilter />
          {hasActiveFilters ? (
            <button type="button" onClick={clearAll} className="h-10 shrink-0 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-muted transition hover:border-primary hover:text-primary xl:hidden">
              Təmizlə
            </button>
          ) : null}
        </div>

        {hasActiveFilters ? (
          <button type="button" onClick={clearAll} className="hidden h-11 shrink-0 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary xl:block">
            Filtrləri təmizlə
          </button>
        ) : (
          <div className="hidden h-11 min-w-[126px] items-center justify-center rounded-xl border border-border bg-[#FAFBFD] px-4 text-xs font-medium text-faint xl:flex">
            Filtrlər hazırdır
          </div>
        )}
      </div>
    </div>
  );
}
