import Image from 'next/image';
import Link from 'next/link';
import type { ClubWithRelations } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { inferClubTypeSlugs } from '@/lib/clubType';
import {
  cn,
  DAY_NAMES_AZ,
  formatPriceRange,
  formatTime,
  isClubOpenNow,
  isPremiumActive,
} from '@/lib/utils';

const BAKU_DATE_FORMATTER = new Intl.DateTimeFormat('az-AZ', {
  timeZone: 'Asia/Baku',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function ClubDetail({ club }: { club: ClubWithRelations }) {
  const hasHours = club.opening_hours.length > 0;
  const openNow = hasHours ? isClubOpenNow(club.opening_hours) : false;
  const premiumActive = isPremiumActive(club);
  const statusLabel = !hasHours
    ? 'İş saatları məlum deyil'
    : openNow
      ? 'Hazırda açıqdır'
      : 'Hazırda bağlıdır';
  const typeSlugs = inferClubTypeSlugs(club);
  const realPricing = club.pricing.filter(
    (pricing) => pricing.price_from > 0 && pricing.club_type
  );
  const phoneNumbers = (club.phone ?? '')
    .split(/\s*\/\s*|\s*,\s*|\s*;\s*/)
    .map((phone) => phone.trim())
    .filter(Boolean);
  const hasRating =
    club.rating_avg != null &&
    Number.isFinite(club.rating_avg) &&
    club.rating_avg > 0 &&
    club.rating_avg <= 5 &&
    club.rating_count > 0;
  const updatedAt = new Date(club.updated_at);
  const updatedLabel = Number.isNaN(updatedAt.getTime())
    ? null
    : BAKU_DATE_FORMATTER.format(updatedAt);

  const sortedHours = [...club.opening_hours]
    .filter((hours) => hours.day_of_week >= 0 && hours.day_of_week <= 6)
    .sort((a, b) => a.day_of_week - b.day_of_week);
  const sortedImages = [...club.images].sort((a, b) => a.position - b.position);
  const fallbackType =
    typeSlugs.length === 2
      ? 'PC + PlayStation'
      : typeSlugs[0] === 'pc'
        ? 'PC Gaming'
        : typeSlugs[0] === 'playstation'
          ? 'PlayStation'
          : 'Gaming Club';
  const fallbackTint =
    typeSlugs.length === 1 && typeSlugs[0] === 'playstation'
      ? 'from-ps-tint'
      : typeSlugs.length === 1 && typeSlugs[0] === 'pc'
        ? 'from-pc-tint'
        : 'from-primary/10';

  const googleMapsUrl =
    club.latitude != null && club.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${club.latitude},${club.longitude}`
      : null;
  const clubContext = `club=${encodeURIComponent(club.name)}&slug=${encodeURIComponent(club.slug)}`;
  const correctionHref = `/elaqe?${clubContext}`;
  const ownerHref = `/klub-sahibi?${clubContext}`;

  return (
    <article className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
      <div className="mb-4">
        <Link href="/" className="text-sm font-medium text-muted transition hover:text-ink">
          ← Klublara qayıt
        </Link>
      </div>

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
          {sortedImages.slice(1, 5).map((img, index) => (
            <div key={img.id} className="relative col-span-2 aspect-square sm:col-span-1">
              <Image
                src={img.url}
                alt={`${club.name} — şəkil ${index + 2}`}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={cn('mb-6 flex aspect-[16/7] items-center justify-center overflow-hidden rounded-card border border-border bg-gradient-to-br via-surface to-surface-alt', fallbackTint)}>
          <div className="px-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary font-display text-3xl font-bold text-white shadow-card">
              G
            </div>
            <p className="mt-4 font-display text-lg font-semibold text-ink">{club.name}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{fallbackType}</p>
            <p className="mt-3 text-sm text-muted">Real klub şəkilləri əlavə ediləndə burada görünəcək.</p>
          </div>
        </div>
      )}

      <div className="border-b border-border pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {club.name}
              </h1>
              {premiumActive ? <Badge tone="premium">VIP</Badge> : null}
              {typeSlugs.map((slug) => (
                <Badge key={slug} tone={slug === 'pc' ? 'pc' : 'ps'}>
                  {slug === 'pc' ? 'PC' : 'PlayStation'}
                </Badge>
              ))}
            </div>

            <p className="mt-2 text-sm text-muted">
              {club.district?.name ?? 'Rayon göstərilməyib'}
              {club.address ? ` · ${club.address}` : ''}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span
                className={
                  openNow
                    ? 'inline-flex items-center gap-1.5 text-sm font-medium text-live'
                    : 'inline-flex items-center gap-1.5 text-sm font-medium text-muted'
                }
              >
                <span className={openNow ? 'h-2 w-2 rounded-full bg-live' : 'h-2 w-2 rounded-full bg-muted'} />
                {statusLabel}
              </span>
              {hasRating ? (
                <span className="text-sm font-medium text-ink" aria-label={`${club.rating_avg} reytinq, ${club.rating_count} rəy`}>
                  ★ {club.rating_avg!.toFixed(1)} <span className="font-normal text-muted">({club.rating_count})</span>
                </span>
              ) : null}
            </div>
          </div>

          {googleMapsUrl ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: '#1A73E8', color: '#ffffff' }}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-control px-5 text-sm font-semibold no-underline transition hover:opacity-90"
            >
              Google Maps-də marşrut
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid gap-8 py-6 lg:grid-cols-[1fr_320px]">
        <div>
          {club.description ? (
            <section className="mb-7">
              <h2 className="mb-2 font-display text-base font-semibold text-ink">Klub haqqında</h2>
              <p className="text-sm leading-6 text-muted">{club.description}</p>
            </section>
          ) : null}

          <section className="mb-7">
            <h2 className="mb-3 font-display text-base font-semibold text-ink">Qiymətlər</h2>
            {realPricing.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                {realPricing.map((pricing) => (
                  <div
                    key={pricing.id}
                    className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
                  >
                    <Badge tone={pricing.club_type.slug === 'pc' ? 'pc' : 'ps'}>
                      {pricing.club_type.name}
                    </Badge>
                    <span className="font-mono text-sm font-semibold text-ink">
                      {formatPriceRange(pricing.price_from, pricing.price_to, pricing.unit)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface-alt px-4 py-4 text-sm text-muted">
                Qiymət məlumatı hələ təsdiqlənməyib.
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-ink">İş saatları</h2>
            {sortedHours.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                {sortedHours.map((hours) => (
                  <div
                    key={hours.id}
                    className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm last:border-b-0"
                  >
                    <span className="text-ink">{DAY_NAMES_AZ[hours.day_of_week]}</span>
                    <span className={hours.is_closed ? 'font-mono text-muted' : 'font-mono text-ink'}>
                      {hours.is_closed
                        ? 'Bağlıdır'
                        : `${formatTime(hours.open_time)} – ${formatTime(hours.close_time)}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface-alt px-4 py-4 text-sm text-muted">
                İş saatları hələ təsdiqlənməyib.
              </div>
            )}
          </section>

          <p className="mt-4 text-xs leading-5 text-muted">
            Qiymət və iş saatları dəyişə bilər. Getməzdən əvvəl mümkün olduqda klubun rəsmi əlaqə kanalından məlumatı dəqiqləşdirin.
          </p>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Əlaqə və ünvan</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Ünvan</p>
              <p className="mt-1 leading-5 text-ink">{club.address || 'Ünvan göstərilməyib'}</p>
            </div>

            {phoneNumbers.length > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Telefon</p>
                <div className="mt-1 flex flex-col items-start gap-1">
                  {phoneNumbers.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {club.instagram_url ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Instagram</p>
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
              style={{ backgroundColor: '#1A73E8', color: '#ffffff' }}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-control px-4 text-sm font-semibold no-underline transition hover:opacity-90"
            >
              Marşrut qur
            </a>
          ) : null}

          <div className="mt-5 border-t border-border pt-4">
            {updatedLabel ? (
              <p className="text-xs leading-5 text-muted">Məlumat son dəfə {updatedLabel} tarixində yenilənib.</p>
            ) : null}
            <div className="mt-3 flex flex-col gap-2">
              <Link href={correctionHref} className="text-sm font-semibold text-primary hover:underline">
                Məlumatda səhv var? Bildir
              </Link>
              <Link href={ownerHref} className="text-sm font-semibold text-ink hover:text-primary">
                Bu klubun sahibisiniz? Klub məlumatını təsdiqləyin
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
