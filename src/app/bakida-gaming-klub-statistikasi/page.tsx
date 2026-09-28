import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { inferClubTypeSlugs } from '@/lib/clubType';

const title = 'Bakı və ətrafında gaming klub bazarı — statistika və qiymətlər';
const fallbackDescription = 'GameYer-in public klub datası əsasında Bakı və ətrafında PC və PlayStation klublarının sayı, rayon bölgüsü, qiymət aralığı və 24/7 işləyən məkanların statistikası.';

function isOpen24HoursEveryDay(hours: Awaited<ReturnType<typeof getClubs>>[number]['opening_hours']) {
  const byDay = new Map(hours.map((item) => [item.day_of_week, item]));
  return Array.from({ length: 7 }, (_, day) => day).every((day) => {
    const item = byDay.get(day);
    if (!item || item.is_closed || !item.open_time || !item.close_time) return false;
    return item.open_time.startsWith('00:00') && (item.close_time.startsWith('23:59') || item.close_time.startsWith('00:00'));
  });
}

function startingHourlyPrice(club: Awaited<ReturnType<typeof getClubs>>[number], type: 'pc' | 'playstation') {
  const prices = club.pricing
    .filter((item) => item.club_type?.slug === type && item.unit === 'saat' && item.price_from > 0)
    .map((item) => item.price_from);
  return prices.length > 0 ? Math.min(...prices) : null;
}

function numericRange(values: Array<number | null>) {
  const filtered = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (filtered.length === 0) return null;
  return { min: Math.min(...filtered), max: Math.max(...filtered) };
}

export async function generateMetadata(): Promise<Metadata> {
  const clubs = await getClubs();
  const pcCount = clubs.filter((club) => inferClubTypeSlugs(club).includes('pc')).length;
  const psCount = clubs.filter((club) => inferClubTypeSlugs(club).includes('playstation')).length;
  const description = clubs.length > 0
    ? `GameYer-in public datasında hazırda ${clubs.length} aktiv gaming klub var: ${pcCount} PC, ${psCount} PlayStation. Rayon bölgüsü, qiymət və 24/7 statistikasına bax.`
    : fallbackDescription;

  return {
    title,
    description,
    alternates: { canonical: '/bakida-gaming-klub-statistikasi' },
    robots: clubs.length > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      locale: 'az_AZ',
      url: '/bakida-gaming-klub-statistikasi',
      title: `${title} | GameYer`,
      description,
    },
  };
}

export default async function GamingClubMarketStatsPage() {
  const clubs = await getClubs();
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/bakida-gaming-klub-statistikasi`;

  let pcCount = 0;
  let psCount = 0;
  let hybridCount = 0;
  let pricedCount = 0;
  let open24Count = 0;
  let verifiedCount = 0;
  let latestUpdated: string | null = null;

  const pcStartingPrices: Array<number | null> = [];
  const psStartingPrices: Array<number | null> = [];
  const districtMap = new Map<string, { name: string; slug: string; total: number; pc: number; ps: number }>();

  for (const club of clubs) {
    const types = inferClubTypeSlugs(club);
    const hasPc = types.includes('pc');
    const hasPs = types.includes('playstation');
    const pcPrice = startingHourlyPrice(club, 'pc');
    const psPrice = startingHourlyPrice(club, 'playstation');

    if (hasPc) pcCount += 1;
    if (hasPs) psCount += 1;
    if (hasPc && hasPs) hybridCount += 1;
    if (pcPrice != null || psPrice != null) pricedCount += 1;
    if (isOpen24HoursEveryDay(club.opening_hours ?? [])) open24Count += 1;
    if (club.is_verified) verifiedCount += 1;
    if (club.updated_at && (!latestUpdated || Date.parse(club.updated_at) > Date.parse(latestUpdated))) latestUpdated = club.updated_at;

    pcStartingPrices.push(pcPrice);
    psStartingPrices.push(psPrice);

    if (!club.district?.slug) continue;
    const current = districtMap.get(club.district.slug) ?? {
      name: club.district.name,
      slug: club.district.slug,
      total: 0,
      pc: 0,
      ps: 0,
    };
    current.total += 1;
    if (hasPc) current.pc += 1;
    if (hasPs) current.ps += 1;
    districtMap.set(club.district.slug, current);
  }

  const pcRange = numericRange(pcStartingPrices);
  const psRange = numericRange(psStartingPrices);
  const districtRows = [...districtMap.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'az'));
  const pricedShare = clubs.length > 0 ? Math.round((pricedCount / clubs.length) * 100) : 0;
  const open24Share = clubs.length > 0 ? Math.round((open24Count / clubs.length) * 100) : 0;
  const verifiedShare = clubs.length > 0 ? Math.round((verifiedCount / clubs.length) * 100) : 0;
  const latestLabel = latestUpdated
    ? new Intl.DateTimeFormat('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(latestUpdated))
    : null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Gaming klub bazarı statistikası', item: pageUrl },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        description: fallbackDescription,
        ...(latestUpdated ? { dateModified: latestUpdated } : {}),
        isPartOf: { '@id': `${siteUrl}#website` },
        about: [
          { '@type': 'Thing', name: 'Bakı gaming klubları' },
          { '@type': 'Thing', name: 'PC klubları' },
          { '@type': 'Thing', name: 'PlayStation klubları' },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/">GameYer</Link> / Gaming klub bazarı statistikası
      </nav>

      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakı və ətrafında gaming klub bazarı: canlı statistika</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        Bu səhifə GameYer-də public görünən real klub profillərindən avtomatik hesablanır. Məqsəd Bakı və yaxın ərazilərdə gaming məkanlarının sayını, PC/PlayStation bölgüsünü, qiymət əhatəsini və rayon sıxlığını bir yerdə göstərməkdir.
        {latestLabel ? ` Məlumatın son yenilənmə siqnalı: ${latestLabel}.` : ''}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <section className="rounded-card border border-border bg-surface p-5">
          <div className="text-3xl font-bold text-ink">{clubs.length}</div>
          <h2 className="mt-1 font-display text-base font-bold text-ink">Aktiv public klub</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Koordinatı, public sosial mənbəsi və təsdiqlənmiş PC/PlayStation tipi olan aktiv profillər.</p>
        </section>
        <section className="rounded-card border border-border bg-surface p-5">
          <div className="text-3xl font-bold text-ink">{pcCount}</div>
          <h2 className="mt-1 font-display text-base font-bold text-ink">PC klubu</h2>
          <p className="mt-1 text-xs leading-5 text-muted">PC tipi olan profillər. Hybrid klublar bu rəqəmə daxildir.</p>
        </section>
        <section className="rounded-card border border-border bg-surface p-5">
          <div className="text-3xl font-bold text-ink">{psCount}</div>
          <h2 className="mt-1 font-display text-base font-bold text-ink">PlayStation klubu</h2>
          <p className="mt-1 text-xs leading-5 text-muted">PlayStation tipi olan profillər. Hybrid klublar bu rəqəmə daxildir.</p>
        </section>
        <section className="rounded-card border border-border bg-surface p-5">
          <div className="text-3xl font-bold text-ink">{hybridCount}</div>
          <h2 className="mt-1 font-display text-base font-bold text-ink">PC + PlayStation</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Hər iki platformanı təqdim etdiyi public data ilə göstərilən məkanlar.</p>
        </section>
        <section className="rounded-card border border-border bg-surface p-5">
          <div className="text-3xl font-bold text-ink">{open24Count}</div>
          <h2 className="mt-1 font-display text-base font-bold text-ink">24/7 klub</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Həftənin bütün 7 günü 24 saat işlədiyi göstərilən profillər — bazanın təxminən {open24Share}%-i.</p>
        </section>
        <section className="rounded-card border border-border bg-surface p-5">
          <div className="text-3xl font-bold text-ink">{verifiedCount}</div>
          <h2 className="mt-1 font-display text-base font-bold text-ink">Verified profil</h2>
          <p className="mt-1 text-xs leading-5 text-muted">GameYer-də verified statusu olan public profillər — bazanın təxminən {verifiedShare}%-i.</p>
        </section>
      </div>

      <section className="mt-8 rounded-card border border-border bg-surface p-5" aria-labelledby="market-price-heading">
        <h2 id="market-price-heading" className="font-display text-lg font-bold text-ink">Qiymət datasının əhatəsi</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {pricedCount} klubda saatlıq PC və ya PlayStation qiyməti var — public bazanın təxminən {pricedShare}%-i.
          {pcRange ? ` Klublar üzrə başlanğıc PC qiymətləri ${pcRange.min}–${pcRange.max} AZN/saat aralığındadır.` : ''}
          {psRange ? ` Başlanğıc PlayStation qiymətləri ${psRange.min}–${psRange.max} AZN/saat aralığındadır.` : ''}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Qiymətləri müqayisə et</Link>
          <Link href="/bakida-ucuz-pc-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Ucuz PC klubları</Link>
          <Link href="/bakida-ucuz-playstation-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Ucuz PlayStation klubları</Link>
        </div>
      </section>

      {districtRows.length > 0 ? (
        <section className="mt-8" aria-labelledby="market-district-heading">
          <h2 id="market-district-heading" className="font-display text-xl font-bold text-ink">Rayon və şəhər üzrə klub sıxlığı</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Public GameYer inventarında daha çox klub olan ərazilər yuxarıda göstərilir.</p>
          <div className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
            <div className="grid grid-cols-[1fr_72px_72px_72px] gap-2 border-b border-border px-4 py-3 text-xs font-semibold text-muted">
              <span>Ərazi</span><span className="text-right">Cəmi</span><span className="text-right">PC</span><span className="text-right">PS</span>
            </div>
            {districtRows.map((district) => (
              <Link key={district.slug} href={`/rayon/${district.slug}`} className="grid grid-cols-[1fr_72px_72px_72px] gap-2 border-b border-border px-4 py-3 text-sm text-ink last:border-b-0 hover:bg-muted/5">
                <span className="font-semibold">{district.name}</span>
                <span className="text-right font-mono">{district.total}</span>
                <span className="text-right font-mono">{district.pc}</span>
                <span className="text-right font-mono">{district.ps}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-ink">Bu statistika necə hesablanır?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Hesablamaya yalnız GameYer-də public görünməyə uyğun aktiv klublar daxil edilir. Qiymət statistikası yalnız bazada mövcud olan saatlıq tariflərdən, 24/7 göstəricisi isə həftənin bütün günləri üçün daxil edilmiş iş saatlarından hesablanır. Saylar klub datası yeniləndikcə avtomatik dəyişə bilər.
        </p>
        <Link href="/melumat-metodologiyasi" className="mt-4 inline-flex rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink hover:border-primary">Məlumat metodologiyası</Link>
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/bakida-pc-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">PC klubları</Link>
        <Link href="/bakida-playstation-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">PlayStation klubları</Link>
        <Link href="/yaxinliqda-gaming-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Yaxın klubları tap</Link>
        <Link href="/?view=map" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Xəritəni aç</Link>
      </div>
    </div>
  );
}
