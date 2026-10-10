import type { ClubWithRelations } from '@/types/database';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { getPlatformStartingPrices } from '@/lib/pricing';
import { TrackedSeoClubLink } from '@/components/seo/TrackedSeoClubLink';

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
      {clubs.map((club, index) => {
        const typeSlugs = inferClubTypeSlugs(club);
        const typeLabel = typeSlugs
          .map((slug) => (slug === 'pc' ? 'PC' : 'PlayStation'))
          .join(' + ');
        const startingPrices = getPlatformStartingPrices(club.pricing);
        const priceParts = [
          startingPrices.pc ? `PC ${startingPrices.pc.price_from} AZN-dən` : null,
          startingPrices.playstation ? `PS ${startingPrices.playstation.price_from} AZN-dən` : null,
        ].filter((value): value is string => Boolean(value));
        const priceSummary = priceParts.length > 0 ? priceParts.join(' · ') : null;
        const hasHours = club.opening_hours.some(
          (item) => !item.is_closed && Boolean(item.open_time) && Boolean(item.close_time),
        );
        const knownDetails = [
          priceSummary ? `qiymət ${priceSummary}` : null,
          hasHours ? 'iş saatları mövcuddur' : null,
          club.phone ? 'telefon mövcuddur' : null,
        ].filter((value): value is string => Boolean(value));
        const fallbackDescription =
          knownDetails.length > 0
            ? `${club.district?.name ?? 'Bakı'} üzrə ${typeLabel || 'gaming'} klubu — ${knownDetails.join(' · ')}.`
            : `${club.district?.name ?? 'Bakı'} üzrə ${typeLabel || 'gaming'} klubu. Ünvan və xəritə məlumatlarına bax.`;

        return (
          <TrackedSeoClubLink
            key={club.id}
            href={`/klub/${encodeURIComponent(club.slug)}`}
            clubId={club.id}
            clubSlug={club.slug}
            clubName={club.name}
            districtName={club.district?.name}
            listPosition={index + 1}
            className="group rounded-card border border-border bg-surface p-4 shadow-card transition hover:border-border-strong hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold text-ink transition-colors group-hover:text-primary">
                  {club.name}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {club.district?.name ?? 'Bakı'}
                  {club.address ? ` · ${club.address}` : ''}
                </p>
              </div>
              {typeLabel ? (
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {typeLabel}
                </span>
              ) : null}
            </div>

            <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted">
              {club.description || fallbackDescription}
            </p>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
              <span className="min-w-0 text-xs font-mono font-semibold text-ink">
                {priceSummary ?? 'Qiymət məlum deyil'}
              </span>
              <span
                data-seo-club-cta="true"
                aria-hidden="true"
                className="shrink-0 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5"
              >
                Klub profilinə bax →
              </span>
            </div>
          </TrackedSeoClubLink>
        );
      })}
    </div>
  );
}
