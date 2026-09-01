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
  onClearFilters?: () => void;
}

/**
 * Klub siyahısını göstərir. Data page.tsx-də (server) çəkilir və
 * ExploreView (client) vasitəsilə buraya ötürülür; bura yalnız render +
 * hover/aktiv vəziyyəti xəritəyə ötürmək üçün lazımi əlaqələndirməni edir.
 */
export function ClubList({ clubs, activeClubId, onHoverClub, cardRefs, searchActive, onClearFilters }: ClubListProps) {
  if (clubs.length === 0) {
    const title = searchActive
      ? 'Axtarışa uyğun klub tapılmadı'
      : 'Bu filtrə uyğun klub tapılmadı';

    const description = onClearFilters
      ? 'Axtarış sözünü dəyiş və ya aktiv filtrləri təmizlə.'
      : searchActive
        ? 'Başqa klub adı, rayon və ya açar söz yoxla.'
        : 'Hazırda bu seçimə uyğun aktiv klub yoxdur.';

    return (
      <EmptyState
        title={title}
        description={description}
        actionLabel={onClearFilters ? 'Filtrləri təmizlə' : undefined}
        onAction={onClearFilters}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {clubs.map((club, index) => (
        <ClubCard
          key={club.id}
          club={club}
          listPosition={index + 1}
          active={club.id === activeClubId}
          onMouseEnter={onHoverClub ? () => onHoverClub(club.id) : undefined}
          ref={cardRefs ? (el) => { cardRefs.current[club.id] = el; } : undefined}
          imagePriority={index === 0}
        />
      ))}
    </div>
  );
}
