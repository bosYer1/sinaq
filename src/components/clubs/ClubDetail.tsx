import Image from 'next/image';
import type { ClubWithRelations } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { RatingBadge } from './RatingBadge';
import { DAY_NAMES_AZ, formatPriceRange, formatTime, isClubOpenNow } from '@/lib/utils';

export function ClubDetail({ club }: { club: ClubWithRelations }) {
  const openNow = isClubOpenNow(club.opening_hours);
  const sortedHours = [...club.opening_hours].sort((a, b) => a.day_of_week - b.day_of_week);
  const sortedImages = [...club.images].sort((a, b) => a.position - b.position);

  return (
    <article className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Şəkil qalereyası */}
      {sortedImages.length > 0 ? (
        <div className="mb-5 grid grid-cols-4 gap-1.5 overflow-hidden rounded-card">
          <div className="relative col-span-4 aspect-video sm:col-span-2 sm:row-span-2 sm:aspect-square">
            <Image
              src={sortedImages[0].url}
              alt={club.name}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
          {sortedImages.slice(1, 5).map((img) => (
            <div key={img.id} className="relative col-span-2 aspect-square sm:col-span-1">
              <Image src={img.url} alt={club.name} fill sizes="25vw" className="object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-5 flex aspect-video items-center justify-center rounded-card bg-surface-alt text-4xl">
          🎮
        </div>
      )}

      {/* Başlıq bloku */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-ink">{club.name}</h1>
            {club.is_premium && <Badge tone="premium">VIP</Badge>}
          </div>
          <p className="text-sm text-muted">
            {club.district?.name} · {club.address}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <RatingBadge rating={club.rating_avg} count={club.rating_count} />
        <span
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${openNow ? 'text-live' : 'text-muted'}`}
        >
          <span className={`h-2 w-2 rounded-full ${openNow ? 'bg-live' : 'bg-muted'}`} />
          {openNow ? 'Hazırda açıqdır' : 'Hazırda bağlıdır'}
        </span>
      </div>

      {club.description && <p className="mb-6 text-sm leading-relaxed text-ink">{club.description}</p>}

      {/* Qiymətlər */}
      <section className="mb-6">
        <h2 className="mb-2 font-display text-sm font-semibold text-ink">Qiymətlər</h2>
        <div className="flex flex-col gap-2">
          {club.pricing.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5"
            >
              <Badge tone={p.club_type.slug === 'pc' ? 'pc' : 'ps'}>{p.club_type.name}</Badge>
              <span className="font-mono text-sm font-medium text-ink">
                {formatPriceRange(p.price_from, p.price_to, p.unit)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* İş saatları */}
      <section className="mb-6">
        <h2 className="mb-2 font-display text-sm font-semibold text-ink">İş saatları</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          {sortedHours.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between border-b border-border px-3.5 py-2 text-sm last:border-b-0 odd:bg-surface-alt/50"
            >
              <span className="text-ink">{DAY_NAMES_AZ[h.day_of_week]}</span>
              <span className="font-mono text-muted">
                {h.is_closed ? 'Bağlıdır' : `${formatTime(h.open_time)} – ${formatTime(h.close_time)}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Əlaqə */}
      <section>
        <h2 className="mb-2 font-display text-sm font-semibold text-ink">Əlaqə</h2>
        <div className="flex flex-col gap-2 text-sm">
          {club.phone && (
            <a href={`tel:${club.phone}`} className="text-primary hover:underline">
              📞 {club.phone}
            </a>
          )}
          {club.instagram_url && (
            <a
              href={club.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              📷 Instagram
            </a>
          )}
        </div>
      </section>
    </article>
  );
}
