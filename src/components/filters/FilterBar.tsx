'use client';

import type { District, ClubType } from '@/types/database';
import { DistrictFilter } from './DistrictFilter';
import { TypeFilter } from './TypeFilter';
import { PriceFilter } from './PriceFilter';
import { ViewToggle } from './ViewToggle';
import { useFilters } from '@/hooks/useFilters';

interface FilterBarProps { districts: District[]; types: ClubType[]; }

export function FilterBar({ districts, types }: FilterBarProps) {
  const { hasActiveFilters, clearAll } = useFilters();

  return (
    <div className="sticky top-16 z-20 shrink-0 border-b border-white/5 bg-[#0D0F14]/88 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Klub filtrləri">
            <TypeFilter types={types}/>
            <DistrictFilter districts={districts}/>
            <PriceFilter/>
            {hasActiveFilters ? (
              <button type="button" onClick={clearAll} className="h-10 shrink-0 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-muted transition hover:border-primary/35 hover:text-white">
                Təmizlə
              </button>
            ) : null}
          </div>
          <div className="shrink-0"><ViewToggle/></div>
        </div>
      </div>
    </div>
  );
}
