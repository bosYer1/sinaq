import { Suspense } from 'react';
import { getClubs } from '@/lib/queries/clubs';
import { getDistricts, getClubTypes } from '@/lib/queries/districts';
import { isSupabaseConfigured } from '@/lib/config';
import { FilterBar } from '@/components/filters/FilterBar';
import { ExploreView } from '@/components/explore/ExploreView';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ClubFilters } from '@/types/database';

export const dynamic = 'force-dynamic'; // Filtrlər hər sorğuda dəyişdiyi üçün statik cache-lənmir

interface PageProps {
  searchParams: {
    district?: string;
    type?: string;
    price_max?: string;
    q?: string;
    view?: string;
  };
}

/**
 * Ana səhifə — Server Component.
 * URL searchParams-dan filtrləri oxuyur, Supabase-dən (və ya Supabase
 * qoşulmayıbsa mock data-dan) uyğun klubları çəkir, mobil-first layout-da
 * (tab keçidli) və ya desktop-da (yan-yana) göstərir.
 */
export default async function HomePage({ searchParams }: PageProps) {
  const filters: ClubFilters = {
    district: searchParams.district,
    type: searchParams.type,
    priceMax: searchParams.price_max ? Number(searchParams.price_max) : undefined,
    q: searchParams.q,
  };
  const view = searchParams.view === 'map' ? 'map' : 'list';

  const [clubs, districts, types] = await Promise.all([getClubs(filters), getDistricts(), getClubTypes()]);

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      {!isSupabaseConfigured() && (
        <div className="border-b border-warn/30 bg-warn-light px-4 py-1.5 text-center text-xs font-medium text-amber-800 sm:px-6">
          Nümunə (mock) data göstərilir — Supabase hələ qoşulmayıb.
        </div>
      )}

      <Suspense
        fallback={
          <div className="h-[57px] border-b border-border bg-surface">
            <Skeleton className="m-3 h-9 w-full rounded-full" />
          </div>
        }
      >
        <FilterBar districts={districts} types={types} />
      </Suspense>

      <ExploreView clubs={clubs} view={view} searchActive={Boolean(filters.q)} />
    </div>
  );
}
