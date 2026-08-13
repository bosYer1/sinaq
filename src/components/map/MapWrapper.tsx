'use client';

import dynamic from 'next/dynamic';
import type { ClubWithDistance } from '@/types/database';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Leaflet birbaşa `window` obyektinə istinad etdiyi üçün server-də render
 * oluna bilmir. App Router-də `ssr: false` yalnız Client Component daxilində
 * icazəlidir (Server Component-də xəta verir) — buna görə bu ayrıca client
 * wrapper mövcuddur: page.tsx (server) sadəcə <MapWrapper /> import edir,
 * faktiki dynamic-import məntiqi isə burada, client tərəfdə baş verir.
 */
const ClubMap = dynamic(() => import('./ClubMap').then((mod) => mod.ClubMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

interface MapWrapperProps {
  clubs: ClubWithDistance[];
  activeClubId?: string | null;
  onSelectClub?: (id: string) => void;
}

export function MapWrapper({ clubs, activeClubId, onSelectClub }: MapWrapperProps) {
  return <ClubMap clubs={clubs} activeClubId={activeClubId} onSelectClub={onSelectClub} />;
}
