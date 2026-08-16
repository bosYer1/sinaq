'use client';

import { useSearchParams } from 'next/navigation';
import type { District, ClubType } from '@/types/database';
import { SearchFilter } from './SearchFilter';
import { DistrictFilter } from './DistrictFilter';
import { TypeFilter } from './TypeFilter';
import { PriceFilter } from './PriceFilter';
import { ViewToggle } from './ViewToggle';
import { useFilters } from '@/hooks/useFilters';

interface FilterBarProps { districts: District[]; types: ClubType[]; }
export function FilterBar({ districts, types }: FilterBarProps) {
  const { hasActiveFilters, clearAll } = useFilters();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';
  return <div className="sticky top-16 z-20 shrink-0 border-b border-border bg-white/88 backdrop-blur-xl">
    <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="w-full lg:w-[430px]"><SearchFilter key={searchQuery}/></div><div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 lg:flex lg:flex-1"><div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-1 lg:overflow-visible lg:pb-0" aria-label="Klub filtrləri"><TypeFilter types={types}/><DistrictFilter districts={districts}/><PriceFilter/>{hasActiveFilters ? <button type="button" onClick={clearAll} className="h-10 shrink-0 rounded-full border border-border bg-white px-3 text-xs font-semibold text-muted shadow-sm transition hover:border-primary/25 hover:text-ink">Təmizlə</button> : null}</div><div className="shrink-0"><ViewToggle/></div></div></div></div>
  </div>;
}
