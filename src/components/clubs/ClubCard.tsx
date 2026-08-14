import Image from 'next/image';
import Link from 'next/link';
import type { ClubWithRelations } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { formatPriceRange, isClubOpenNow } from '@/lib/utils';

function ClubThumbFallback({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div className="flex h-full w-full items-center justify-center bg-primary-light">
      <span className="font-display text-lg font-semibold text-primary">{initial}</span>
    </div>
  );
}

export function ClubCard({ club }: { club: ClubWithRelations }) {
  const cover = club.images.find((img) => img.is_cover) ?? club.images[0];
  const openNow = isClubOpenNow(club.opening_hours);
  const cheapestPricing = [...club.pricing].sort((a, b) => a.price_from - b.price_from)[0];

  return (
    <Link
      href={`/klub/${club.slug}`}
      className="group flex gap-3 rounded-lg border border-border bg-surface p-2.5 transition-colors hover:border-primary/40 hover:bg-surface-alt/40"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-alt">
        {cover ? (
          <Image src={cover.url} alt={club.name} fill sizes="64px" className="object-cover" />
        ) : (
          <ClubThumbFallback name={club.name} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-display text-sm font-semibold leading-tight text-ink">{club.name}</h3>
          {club.is_premium && (
            <Badge tone="premium" className="shrink-0 !rounded-md !px-1.5 !py-0.5 text-[10px]">
              Premium
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className="truncate">{club.district?.name ?? 'Rayon göstərilməyib'}</span>
          {club.rating_avg && (
            <>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-0.5 text-ink">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-warn">
                  <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7L10 1.5z" />
                </svg>
                {club.rating_avg.toFixed(1)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5">
            {club.pricing.map((p) => (
              <Badge key={p.id} tone={p.club_type.slug === 'pc' ? 'pc' : 'ps'} className="!rounded-md text-[10px]">
                {p.club_type.slug === 'pc' ? 'PC' : 'PS'}
              </Badge>
            ))}
            <span className="flex items-center gap-1 text-[11px] font-medium text-live">
              <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-live' : 'bg-muted'}`} />
              {openNow ? 'Açıqdır' : <span className="text-muted">Bağlıdır</span>}
            </span>
          </div>
          {cheapestPricing && (
            <span className="shrink-0 font-mono text-xs font-medium text-ink">
              {formatPriceRange(cheapestPricing.price_from, cheapestPricing.price_to, cheapestPricing.unit)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
