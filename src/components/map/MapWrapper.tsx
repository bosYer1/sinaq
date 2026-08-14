'use client';

import dynamic from 'next/dynamic';
import type { ClubWithDistance } from '@/types/database';
import { Skeleton } from '@/components/ui/Skeleton';

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
  return (
    <div className="relative h-full w-full">
      <ClubMap clubs={clubs} activeClubId={activeClubId} onSelectClub={onSelectClub} />
    </div>
  );
}
