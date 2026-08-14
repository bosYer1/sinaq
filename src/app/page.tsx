import { Suspense } from 'react';
import { getClubs } from '@/lib/queries/clubs';
import { getDistricts, getClubTypes } from '@/lib/queries/districts';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { Hero } from '@/components/home/Hero';
import { FilterBar } from '@/components/filters/FilterBar';
import { ClubList } from '@/components/clubs/ClubList';
import { MapWrapper } from '@/components/map/MapWrapper';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfigNotice } from '@/components/ui/ConfigNotice';
import type { ClubFilters } from '@/types/database';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    district?: string;
    type?: string;
    price_max?: string;
    view?: string;
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  if (!isSupabaseConfigured()) {
    return <ConfigNotice />;
  }

  const filters: ClubFilters = {
    district: searchParams.district,
    type: searchParams.type,
    priceMax: searchParams.price_max ? Number(searchParams.price_max) : undefined,
  };
  const view = searchParams.view === 'map' ? 'map' : 'list';

  const [clubs, districts, types] = await Promise.all([getClubs(filters), getDistricts(), getClubTypes()]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Hero
  clubCount={clubs.length}
  districtCount={districts.length}
  openNowCount={openNowCount}
/>

      <Suspense
        fallback={
          <div className="border-b border-border bg-surface px-4 py-3 sm:px-6">
            <Skeleton className="h-9 w-64 rounded-lg" />
          </div>
        }
      >
        <FilterBar districts={districts} types={types} />
      </Suspense>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section
          className={`min-h-0 w-full overflow-y-auto px-4 py-4 sm:px-6 lg:block lg:w-[440px] lg:max-w-[42%] lg:shrink-0 lg:border-r lg:border-border ${
            view === 'map' ? 'hidden' : 'block'
          }`}
        >
          <p className="mb-3 text-sm text-muted">{clubs.length} klub tapıldı</p>
          <ClubList clubs={clubs} />
        </section>

        <section className={`min-h-0 flex-1 ${view === 'map' ? 'block' : 'hidden'} lg:block`}>
          <MapWrapper clubs={clubs} />
        </section>
      </div>
    </div>
  );
}
