import { Suspense } from 'react';
import { getClubs } from '@/lib/queries/clubs';
import { getDistricts, getClubTypes } from '@/lib/queries/districts';
import { isSupabaseConfigured } from '@/lib/config';
import { FilterBar } from '@/components/filters/FilterBar';
import { ExploreView } from '@/components/explore/ExploreView';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ClubFilters } from '@/types/database';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    district?: string;
    type?: string;
    price_max?: string;
    q?: string;
    view?: string;
  };
}

function parsePositiveNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export default async function HomePage({ searchParams }: PageProps) {
  const filters: ClubFilters = {
    district: searchParams.district?.trim() || undefined,
    type: searchParams.type?.trim() || undefined,
    priceMax: parsePositiveNumber(searchParams.price_max),
    q: searchParams.q?.trim() || undefined,
  };
  const view = searchParams.view === 'map' ? 'map' : 'list';

  const [clubs, districts, types] = await Promise.all([
    getClubs(filters),
    getDistricts(),
    getClubTypes(),
  ]);

  return (
    <div className="flex h-[calc(100dvh-56px)] min-h-[500px] flex-col">
      {!isSupabaseConfigured() && (
        <div className="border-b border-warn/30 bg-warn-tint px-4 py-1.5 text-center text-xs font-medium text-warn sm:px-6">
          Supabase hələ qoşulmayıb — heç bir klub göstərilmir.
        </div>
      )}

      <Suspense
        fallback={
          <div className="h-[57px] border-b border-border bg-surface">
            <Skeleton className="m-3 h-9 w-full rounded-control" />
          </div>
        }
      >
        <FilterBar districts={districts} types={types} />
      </Suspense>

      <ExploreView clubs={clubs} view={view} searchActive={Boolean(filters.q)} />
    </div>
  );
}
