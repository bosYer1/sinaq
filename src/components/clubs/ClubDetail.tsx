import Image from 'next/image';
import Link from 'next/link';
import type { ClubWithRelations } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { RatingBadge } from './RatingBadge';
import {
  DAY_NAMES_AZ,
  formatPriceRange,
  formatTime,
  isClubOpenNow,
} from '@/lib/utils';

export function ClubDetail({
  club,
}: {
  club: ClubWithRelations;
}) {
  const openNow = isClubOpenNow(
    club.opening_hours
  );

  const sortedHours = [
    ...club.opening_hours,
  ].sort(
    (a, b) =>
      a.day_of_week - b.day_of_week
  );

  const sortedImages = [
    ...club.images,
  ].sort(
    (a, b) =>
      a.position - b.position
  );

  const googleMapsUrl =
    club.latitude != null &&
    club.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${club.latitude},${club.longitude}`
      : null;

  return (
    <article className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
      {/* Geri */}
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm font-medium text-muted transition hover:text-ink"
        >
          ← Klublara qayıt
        </Link>
      </div>

      {/* Şəkil qalereyası */}
      {sortedImages.length > 0 ? (
        <div className="mb-6 grid grid-cols-4 gap-1.5 overflow-hidden rounded-card bg-surface-alt">
          <div className="relative col-span-4 aspect-video sm:col-span-2 sm:row-span-2 sm:aspect-square">
            <Image
              src={sortedImages[0].url}
              alt={`${club.name} — əsas şəkil`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>

          {sortedImages
            .slice(1, 5)
            .map((img, index) => (
              <div
                key={img.id}
                className="relative col-span-2 aspect-square sm:col-span-1"
              >
                <Image
                  src={img.url}
                  alt={`${club.name} — şəkil ${
                    index + 2
                  }`}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
            ))}
        </div>
      ) : (
        <div className="mb-6 flex aspect-[16/7] items-center justify-center rounded-card border border-border bg-surface-alt">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface">
              <span className="text-lg font-bold text-primary">
                G
              </span>
            </div>

            <p className="mt-3 text-sm text-muted">
              Klub şəkli hələ əlavə edilməyib
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {club.name}
              </h1>

              {club.is_premium ? (
                <Badge tone="premium">
                  VIP
                </Badge>
              ) : null}
            </div>

            <p className="mt-2 text-sm text-muted">
              {club.district?.name ??
                'Rayon göstərilməyib'}

              {club.address
                ? ` · ${club.address}`
                : ''}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <RatingBadge
                rating={club.rating_avg}
                count={club.rating_count}
              />

              <span
                className={
                  openNow
                    ? 'inline-flex items-center gap-1.5 text-sm font-medium text-live'
                    : 'inline-flex items-center gap-1.5 text-sm font-medium text-muted'
                }
              >
                <span
                  className={
                    openNow
                      ? 'h-2 w-2 rounded-full bg-live'
                      : 'h-2 w-2 rounded-full bg-muted'
                  }
                />

                {openNow
                  ? 'Hazırda açıqdır'
                  : 'Hazırda bağlıdır'}
              </span>
            </div>
          </div>

          {googleMapsUrl ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#1A73E8',
                color: '#ffffff',
              }}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-control px-5 text-sm font-semibold no-underline transition hover:opacity-90"
            >
              Google Maps-də marşrut
            </a>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-8 py-6 lg:grid-cols-[1fr_320px]">
        {/* Sol sütun */}
        <div>
          {club.description ? (
            <section className="mb-7">
              <h2 className="mb-2 font-display text-base font-semibold text-ink">
                Klub haqqında
              </h2>

              <p className="text-sm leading-6 text-muted">
                {club.description}
              </p>
            </section>
          ) : null}

          {/* Qiymətlər */}
          <section className="mb-7">
            <h2 className="mb-3 font-display text-base font-semibold text-ink">
              Qiymətlər
            </h2>

            {club.pricing.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                {club.pricing.map(
                  (pricing) => (
                    <div
                      key={pricing.id}
                      className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
                    >
                      <Badge
                        tone={
                          pricing.club_type
                            .slug === 'pc'
                            ? 'pc'
                            : 'ps'
                        }
                      >
                        {
                          pricing.club_type
                            .name
                        }
                      </Badge>

                      <span className="font-mono text-sm font-semibold text-ink">
                        {formatPriceRange(
                          pricing.price_from,
                          pricing.price_to,
                          pricing.unit
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface-alt px-4 py-4 text-sm text-muted">
                Qiymət məlumatı hələ əlavə edilməyib.
              </div>
            )}
          </section>

          {/* İş saatları */}
          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-ink">
              İş saatları
            </h2>

            {sortedHours.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                {sortedHours.map((hours) => (
                  <div
                    key={hours.id}
                    className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm last:border-b-0"
                  >
                    <span className="text-ink">
                      {
                        DAY_NAMES_AZ[
                          hours.day_of_week
                        ]
                      }
                    </span>

                    <span
                      className={
                        hours.is_closed
                          ? 'font-mono text-muted'
                          : 'font-mono text-ink'
                      }
                    >
                      {hours.is_closed
                        ? 'Bağlıdır'
                        : `${formatTime(
                            hours.open_time
                          )} – ${formatTime(
                            hours.close_time
                          )}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface-alt px-4 py-4 text-sm text-muted">
                İş saatları hələ əlavə edilməyib.
              </div>
            )}
          </section>
        </div>

        {/* Sağ sütun */}
        <aside className="h-fit rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">
            Əlaqə və ünvan
          </h2>

          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Ünvan
              </p>

              <p className="mt-1 leading-5 text-ink">
                {club.address ||
                  'Ünvan göstərilməyib'}
              </p>
            </div>

            {club.phone ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Telefon
                </p>

                <a
                  href={`tel:${club.phone}`}
                  className="mt-1 inline-block font-medium text-primary hover:underline"
                >
                  {club.phone}
                </a>
              </div>
            ) : null}

            {club.instagram_url ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Instagram
                </p>

                <a
                  href={club.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-medium text-primary hover:underline"
                >
                  Instagram profilinə bax
                </a>
              </div>
            ) : null}
          </div>

          {googleMapsUrl ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#1A73E8',
                color: '#ffffff',
              }}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-control px-4 text-sm font-semibold no-underline transition hover:opacity-90"
            >
              Marşrut qur
            </a>
          ) : (
            <p className="mt-5 rounded-lg bg-surface-alt p-3 text-xs text-muted">
              Xəritə koordinatları hələ əlavə edilməyib.
            </p>
          )}
        </aside>
      </div>
    </article>
  );
}
