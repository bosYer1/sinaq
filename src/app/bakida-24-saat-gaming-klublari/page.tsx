import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { SeoClubList } from '@/components/seo/SeoClubList';
import type { ClubWithRelations } from '@/types/database';

export const metadata: Metadata = {
  title: 'Bakıda 24 saat PC və gaming klubları',
  description: 'Bakıda gecə-gündüz açıq PC, kompüter, internet və PlayStation klublarını tap. 24 saat işləyən gaming klublarının ünvan, qiymət və xəritə məlumatlarını müqayisə et.',
  alternates: { canonical: '/bakida-24-saat-gaming-klublari' },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    url: '/bakida-24-saat-gaming-klublari',
    title: 'Bakıda 24 saat gaming klubları | GameYer',
    description: 'Bakıdakı gecə-gündüz açıq PC və PlayStation klublarını bir yerdə müqayisə et.',
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
        itemListElement: clubs.map((club, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: club.name,
          url: `${siteUrl}/klub/${club.slug}`,
        })),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <span>24 saat klublar</span>
      </nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda 24 saat PC və gaming klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        Gecə və ya səhər tezdən oynamaq üçün 24 saat açıq gaming klub axtarırsansa, bu siyahıda həftənin 7 günü gecə-gündüz işlədiyi qeyd olunan klubları müqayisə edə bilərsən. Hazırda {clubs.length} klub göstərilir; onlardan {pcCount}-i PC, {playStationCount}-ü PlayStation seçimi təqdim edir.
      </p>
      <div className="mt-7"><SeoClubList clubs={clubs} /></div>
      <section className="mt-10 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-ink">24 saat klub seçərkən nəyə baxmaq lazımdır?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Kluba getməzdən əvvəl detail səhifəsində ünvanı, xəritəni, qiyməti və iş saatını yoxla. İş qrafiki dəyişə bildiyi üçün klubun əlaqə məlumatı varsa getməzdən əvvəl dəqiqləşdirmək faydalıdır.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/bakida-pc-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Bütün PC klubları</Link>
          <Link href="/bakida-playstation-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Bütün PlayStation klubları</Link>
          <Link href="/rayon" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Rayon üzrə axtar</Link>
        </div>
      </section>
    </div>
  );
}
