import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClubs } from '@/lib/queries/clubs';
import { getDistricts } from '@/lib/queries/districts';
import { getSiteUrl } from '@/lib/site-url';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { SeoClubList } from '@/components/seo/SeoClubList';

interface DistrictPageProps { params: Promise<{ slug: string }> }

export const revalidate = 60;

export async function generateStaticParams() {
  const districts = await getDistricts();
  return districts.map((district) => ({ slug: district.slug }));
}

const getDistrictPageData = cache(async (slug: string) => {
  const [districts, clubs] = await Promise.all([getDistricts(), getClubs({ district: slug })]);
  const district = districts.find((item) => item.slug === slug);
  if (!district || clubs.length === 0) return null;
  return { district, clubs };
});

function minHourlyPrice(clubs: Awaited<ReturnType<typeof getClubs>>, type: 'pc' | 'playstation') {
  const prices = clubs.flatMap((club) => club.pricing
    .filter((item) => item.club_type?.slug === type && item.unit === 'saat' && item.price_from > 0)
    .map((item) => item.price_from));
  return prices.length > 0 ? Math.min(...prices) : null;
}

export async function generateMetadata({ params }: DistrictPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getDistrictPageData(slug);
  if (!data) return { title: 'Rayonda aktiv klub tapılmadı', robots: { index: false, follow: true } };

  const pcMin = minHourlyPrice(data.clubs, 'pc');
  const psMin = minHourlyPrice(data.clubs, 'playstation');
  const priceParts = [pcMin != null ? `PC ${pcMin} AZN-dən` : null, psMin != null ? `PlayStation ${psMin} AZN-dən` : null].filter(Boolean).join(', ');
  const title = `${data.district.name} rayonunda PC və PlayStation klubları — qiymətlər`;
  const description = `${data.district.name} rayonundakı ${data.clubs.length} aktiv gaming klubunu müqayisə et.${priceParts ? ` Saatlıq qiymətlər: ${priceParts}.` : ''} Ünvan, iş saatları və xəritə məlumatlarına GameYer-də bax.`;
  const canonical = `/rayon/${data.district.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', locale: 'az_AZ', url: canonical, title: `${title} | GameYer`, description },
    twitter: { card: 'summary', title: `${title} | GameYer`, description },
  };
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { slug } = await params;
  const data = await getDistrictPageData(slug);
  if (!data) notFound();
  const { district, clubs } = data;
  const pcCount = clubs.filter((club) => inferClubTypeSlugs(club).includes('pc')).length;
  const playStationCount = clubs.filter((club) => inferClubTypeSlugs(club).includes('playstation')).length;
  const pcMin = minHourlyPrice(clubs, 'pc');
  const psMin = minHourlyPrice(clubs, 'playstation');
  const cheapPcCount = clubs.filter((club) => club.pricing.some((item) => item.club_type?.slug === 'pc' && item.unit === 'saat' && item.price_from > 0 && item.price_from <= 2)).length;
  const cheapPsCount = clubs.filter((club) => club.pricing.some((item) => item.club_type?.slug === 'playstation' && item.unit === 'saat' && item.price_from > 0 && item.price_from <= 3)).length;
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/rayon/${district.slug}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: `${district.name} klubları`, item: pageUrl },
      ] },
      { '@type': 'ItemList', name: `${district.name} rayonunda gaming klubları`, numberOfItems: clubs.length, itemListElement: clubs.map((club, index) => ({ '@type': 'ListItem', position: index + 1, name: club.name, url: `${siteUrl}/klub/${club.slug}` })) },
    ],
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#F8F9FC]">
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
        <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <Link href="/rayon" className="hover:text-ink">Rayonlar</Link> <span aria-hidden="true">/</span> <span>{district.name}</span>
        </nav>

        <section className="overflow-hidden rounded-[22px] border border-border bg-white px-5 py-6 shadow-[0_10px_35px_rgba(31,35,48,0.05)] sm:px-7 sm:py-7">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{district.name} · Bakı</p>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-[-0.035em] text-ink sm:text-3xl">{district.name} rayonunda gaming klubları</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{district.name} rayonunda aktiv PC və PlayStation məkanlarını bir yerdə müqayisə et. Ünvan, xəritə, iş saatları və təsdiqlənmiş saatlıq qiymətlər klub səhifəsində göstərilir.</p>
              {(pcMin != null || psMin != null) ? <p className="mt-2 text-sm font-medium text-ink">Bu rayonda mövcud tariflər: {pcMin != null ? `PC ${pcMin} AZN-dən` : null}{pcMin != null && psMin != null ? ' · ' : null}{psMin != null ? `PlayStation ${psMin} AZN-dən` : null}.</p> : null}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:flex">
              <div className="min-w-[86px] rounded-xl border border-border bg-[#FAFBFD] px-3 py-2.5 text-center"><div className="text-lg font-bold text-ink">{clubs.length}</div><div className="text-[10px] text-muted">ümumi klub</div></div>
              <div className="min-w-[86px] rounded-xl border border-border bg-pc-tint px-3 py-2.5 text-center"><div className="text-lg font-bold text-pc">{pcCount}</div><div className="text-[10px] text-muted">PC</div></div>
              <div className="min-w-[86px] rounded-xl border border-border bg-ps-tint px-3 py-2.5 text-center"><div className="text-lg font-bold text-ps">{playStationCount}</div><div className="text-[10px] text-muted">PlayStation</div></div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-border/70 pt-5">
            <Link href={`/?district=${encodeURIComponent(district.slug)}&view=map`} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark">Xəritədə göstər</Link>
            {pcCount >= 2 ? <Link href={`/rayon/${district.slug}/pc`} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary">{district.name} PC klubları ({pcCount})</Link> : null}
            {playStationCount >= 2 ? <Link href={`/rayon/${district.slug}/playstation`} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary">{district.name} PlayStation ({playStationCount})</Link> : null}
            {cheapPcCount > 0 ? <Link href="/bakida-ucuz-pc-klublari" className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary">Bakıda ucuz PC klubları</Link> : null}
            {cheapPsCount > 0 ? <Link href="/bakida-ucuz-playstation-klublari" className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary">Bakıda ucuz PlayStation klubları</Link> : null}
          </div>
        </section>

        <section className="mt-5 rounded-[22px] border border-border bg-white p-4 shadow-[0_8px_28px_rgba(31,35,48,0.04)] sm:p-5" aria-labelledby="district-clubs-heading">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 id="district-clubs-heading" className="font-display text-lg font-bold text-ink">{district.name} klubları</h2><p className="mt-1 text-xs text-muted">{clubs.length} aktiv məkan · qiymət, ünvan və iş saatlarını müqayisə et</p></div><Link href="/rayon" className="shrink-0 text-xs font-semibold text-primary hover:text-primary-dark">Digər rayonlar →</Link></div>
          <SeoClubList clubs={clubs} />
        </section>

        <section className="mt-5 rounded-[22px] border border-border bg-white p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-ink">{district.name} rayonunda gaming klub necə seçilir?</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">PC klubu seçərkən saatlıq qiymətlə yanaşı kompüter zonasına və iş saatlarına bax. PlayStation üçün isə konsol modeli, standart və VIP tariflərin fərqini yoxla. GameYer-də {district.name} üzrə klubları xəritədə görüb uyğun məkanı müqayisə edə bilərsən.</p>
        </section>

        <div className="mt-5 flex flex-wrap gap-2"><Link href="/rayon" className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary">Bütün rayonlar</Link><Link href="/" className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary">Bütün klublar</Link></div>
      </div>
    </div>
  );
}
