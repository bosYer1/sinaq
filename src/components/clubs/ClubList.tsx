import type { MutableRefObject } from 'react';
import type { ClubWithDistance } from '@/types/database';
import { ClubCard } from './ClubCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface ClubListProps {
  clubs: ClubWithDistance[];
  activeClubId?: string | null;
  onHoverClub?: (id: string) => void;
  cardRefs?: MutableRefObject<Record<string, HTMLAnchorElement | null>>;
  searchActive?: boolean;
}

/**
 * Klub siyahısını göstərir. Data page.tsx-də (server) çəkilir və
 * ExploreView (client) vasitəsilə buraya ötürülür; bura yalnız render +
 * hover/aktiv vəziyyəti xəritəyə ötürmək üçün lazımi əlaqələndirməni edir.
 */
export function ClubList({ clubs, activeClubId, onHoverClub, cardRefs, searchActive }: ClubListProps) {
  if (clubs.length === 0) {
    return (
      <EmptyState
        title={searchActive ? 'Axtarışa uyğun klub tapılmadı' : 'Bu filtrə uyğun klub tapılmadı'}
        description="Filtrləri dəyişməyi və ya təmizləməyi sınayın."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {clubs.map((club) => (
        <ClubCard
          key={club.id}
          club={club}
          active={club.id === activeClubId}
          onMouseEnter={onHoverClub ? () => onHoverClub(club.id) : undefined}
          ref={cardRefs ? (el) => { cardRefs.current[club.id] = el; } : undefined}
        />
      ))}
    </div>
  );
}
