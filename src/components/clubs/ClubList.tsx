import Link from 'next/link';
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
  searchQuery?: string;
  hasStructuredFilters?: boolean;
  onClearFilters?: () => void;
}

/**
 * Klub siyahısını göstərir. Data page.tsx-də (server) çəkilir və
 * ExploreView (client) vasitəsilə buraya ötürülür; bura yalnız render +
 * hover/aktiv vəziyyəti xəritəyə ötürmək üçün lazımi əlaqələndirməni edir.
 */
export function ClubList({ clubs, activeClubId, onHoverClub, cardRefs, searchActive, searchQuery, hasStructuredFilters, onClearFilters }: ClubListProps) {
  if (clubs.length === 0) {
    const title = searchActive
      ? 'Axtarışa uyğun klub tapılmadı'
      : 'Bu filtrə uyğun klub tapılmadı';

    const description = searchActive
      ? hasStructuredFilters
        ? 'Axtarış sözünü dəyiş və ya aktiv filtrləri birlikdə təmizlə.'
        : 'Başqa klub adı, ünvan və ya açar söz yoxla.'
      : onClearFilters
        ? 'Aktiv filtrləri təmizləyib bütün klublara qayıt.'
        : 'Hazırda bu seçimə uyğun aktiv klub yoxdur.';

    const actionLabel = onClearFilters
      ? searchActive
        ? hasStructuredFilters
          ? 'Axtarış və filtrləri təmizlə'
          : 'Axtarışı təmizlə'
        : 'Filtrləri təmizlə'
      : undefined;

    return (
      <div>
        <EmptyState
          title={title}
          description={description}
          actionLabel={actionLabel}
          onAction={onClearFilters}
        />
        {searchActive ? (
          <div className="mt-3 text-center">
            <Link
              href={searchQuery ? `/elaqe?suggest=${encodeURIComponent(searchQuery)}#new-club` : '/elaqe#new-club'}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Klub siyahıda yoxdur? Təklif et
            </Link>
          </div>
        ) : null}
      </div>
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
