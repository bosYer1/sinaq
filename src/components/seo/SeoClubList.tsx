import Link from 'next/link';
import type { ClubWithRelations } from '@/types/database';
import { inferClubTypeSlugs } from '@/lib/clubType';

export function SeoClubList({ clubs }: { clubs: ClubWithRelations[] }) {
  if (clubs.length === 0) {
    return (
      <p className="rounded-card border border-border bg-surface p-5 text-sm text-muted">
        Bu seçim üzrə aktiv klub tapılmadı.
      </p>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {clubs.map((club) => {
        const typeSlugs = inferClubTypeSlugs(club);
        const typeLabel = typeSlugs
          .map((slug) => (slug === 'pc' ? 'PC' : 'PlayStation'))
          .join(' + ');
        const minPrice = club.pricing
          .filter((item) => item.price_from > 0)
          .sort((a, b) => a.price_from - b.price_from)[0]?.price_from;
        const hasHours = club.opening_hours.some((item) => !item.is_closed && Boolean(item.open_time) && Boolean(item.close_time));
        const knownDetails = [
          minPrice != null ? `qiymət ${minPrice} AZN-dən` : null,
          hasHours ? 'iş saatları mövcuddur' : null,
          club.phone ? 'telefon mövcuddur' : null,
        ].filter((value): value is string => Boolean(value));
        const fallbackDescription = knownDetails.length > 0
          ? `${club.district?.name ?? 'Bakı'} üzrə ${typeLabel || 'gaming'} klubu — ${knownDetails.join(' · ')}.`
          : `${club.district?.name ?? 'Bakı'} üzrə ${typeLabel || 'gaming'} klubu. Ünvan və xəritə məlumatlarına bax.`;

        return (
          <Link
            key={club.id}
            href={`/klub/${encodeURIComponent(club.slug)}`}
            className="rounded-card border border-border bg-surface p-4 shadow-card transition hover:border-border-strong hover:shadow-card-hover"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold text-ink">{club.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {club.district?.name ?? 'Bakı'}{club.address ? ` · ${club.address}` : ''}
                </p>
              </div>
              {typeLabel ? (
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {typeLabel}
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
              <span>{club.description || fallbackDescription}</span>
              <span className="shrink-0 font-mono font-semibold text-ink">
                {minPrice != null ? `${minPrice} AZN-dən` : 'Qiymət məlum deyil'}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
