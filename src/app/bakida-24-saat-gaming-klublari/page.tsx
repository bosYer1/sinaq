import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { SeoClubList } from '@/components/seo/SeoClubList';
import type { ClubWithRelations } from '@/types/database';

export const metadata: Metadata = {
  title: 'Bakıda 24 saat PC, kompüter və PlayStation klubları',
  description: 'Bakıda gecə açıq və 24 saat işləyən PC, kompüter, internet və PlayStation klublarını tap. Gecə gaming üçün ünvan, qiymət, iş saatı və xəritəni müqayisə et.',
  alternates: { canonical: '/bakida-24-saat-gaming-klublari' },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    url: '/bakida-24-saat-gaming-klublari',
    title: 'Bakıda 24 saat gaming klubları | GameYer',
    description: 'Bakıdakı gecə-gündüz açıq PC, kompüter və PlayStation klublarını bir yerdə müqayisə et.',
  },
};

function isOpen24HoursEveryDay(club: ClubWithRelations) {
  const hoursByDay = new Map(club.opening_hours.map((hours) => [hours.day_of_week, hours]));
  return Array.from({ length: 7 }, (_, day) => day).every((day) => {
    const hours = hoursByDay.get(day);
    if (!hours || hours.is_closed || !hours.open_time || !hours.close_time) return false;
    const opensMidnight = hours.open_time.startsWith('00:00');
    const closesFullDay = hours.close_time.startsWith('23:59') || hours.close_time.startsWith('00:00');
    return opensMidnight && closesFullDay;
  });
}

export default async function TwentyFourHourClubsPage() {
  const clubs = (await getClubs()).filter(isOpen24HoursEveryDay);
  const pcCount = clubs.filter((club) => inferClubTypeSlugs(club).includes('pc')).length;
  const playStationCount = clubs.filter((club) => inferClubTypeSlugs(club).includes('playstation')).length;
  const districtCounts = new Map<string, { name: string; slug: string; count: number }>();
  for (const club of clubs) {
    if (!club.district?.slug) continue;
    const current = districtCounts.get(club.district.slug);
    districtCounts.set(club.district.slug, { name: club.district.name, slug: club.district.slug, count: (current?.count ?? 0) + 1 });
  }
  const districts = [...districtCounts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'az'));
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/bakida-24-saat-gaming-klublari`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Bakıda 24 saat gaming klubları', item: pageUrl },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Bakıda 24 saat açıq gaming klubları',
        numberOfItems: clubs.length,
        itemListElement: clubs.map((club, index) => ({ '@type': 'ListItem', position: index + 1, name: club.name, url: `${siteUrl}/klub/${club.slug}` })),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb"><Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <span>24 saat klublar</span></nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda 24 saat PC, kompüter və PlayStation klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Gecə açıq kompüter klubu, 24 saat PC klub və ya gecə işləyən PlayStation klub axtarırsansa, həftənin 7 günü gecə-gündüz işlədiyi qeyd olunan məkanları burada müqayisə et. Hazırda {clubs.length} klub göstərilir; {pcCount}-i PC, {playStationCount}-ü PlayStation seçimi təqdim edir.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Saatlıq qiymətləri müqayisə et</Link>
        <Link href="/?view=map" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">Klubları xəritədə gör</Link>
      </div>

      {districts.length > 0 ? <section className="mt-6" aria-labelledby="night-districts"><h2 id="night-districts" className="font-display text-base font-bold text-ink">24 saat klublar hansı rayonlardadır?</h2><p className="mt-1 text-xs leading-5 text-muted">Gecə gaming üçün uyğun klubların yerləşdiyi rayonlara keç.</p><div className="mt-3 flex flex-wrap gap-2">{districts.map((district) => <Link key={district.slug} href={`/rayon/${district.slug}`} className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-primary">{district.name} ({district.count})</Link>)}</div></section> : null}

      <div className="mt-7"><SeoClubList clubs={clubs} /></div>
      <section className="mt-10 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-ink">Gecə açıq gaming klub seçərkən nəyə baxmaq lazımdır?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">24 saat və gecə açıq klub seçərkən ünvanı, xəritədə məsafəni, saatlıq tarifi və iş qrafikini birlikdə yoxla. İş saatları dəyişə bildiyi üçün klub profilində telefon və ya Instagram varsa, gecə getməzdən əvvəl məlumatı dəqiqləşdirmək faydalıdır.</p>
        <div className="mt-4 flex flex-wrap gap-2"><Link href="/bakida-pc-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Bütün PC klubları</Link><Link href="/bakida-playstation-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Bütün PlayStation klubları</Link><Link href="/bakida-ucuz-pc-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Ucuz PC klubları</Link><Link href="/bakida-ucuz-playstation-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Ucuz PlayStation klubları</Link><Link href="/rayon" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Rayon üzrə axtar</Link></div>
      </section>
    </div>
  );
}
