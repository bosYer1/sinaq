import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { SeoClubList } from '@/components/seo/SeoClubList';
import type { ClubWithRelations } from '@/types/database';

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

const getTwentyFourHourClubs = cache(async () => (await getClubs()).filter(isOpen24HoursEveryDay));

export async function generateMetadata(): Promise<Metadata> {
  const clubs = await getTwentyFourHourClubs();
  const title = 'Bakıda 24 saat PC, kompüter və PlayStation klubları';
  const description = clubs.length > 0
    ? `Bakıda 24 saat və gecə-gündüz işlədiyi qeyd olunan ${clubs.length} gaming klubunu tap. PC, kompüter və PlayStation məkanlarını ünvan, qiymət, iş saatı və xəritə ilə müqayisə et.`
    : 'Bakıda gecə açıq və 24 saat işləyən PC, kompüter və PlayStation klublarını GameYer-də yoxla.';
  return {
    title,
    description,
    alternates: { canonical: '/bakida-24-saat-gaming-klublari' },
    robots: clubs.length > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: 'website', locale: 'az_AZ', url: '/bakida-24-saat-gaming-klublari', title: 'Bakıda 24 saat gaming klubları | GameYer', description },
    twitter: { card: 'summary', title: 'Bakıda 24 saat gaming klubları | GameYer', description },
  };
}

export default async function TwentyFourHourClubsPage() {
  const clubs = await getTwentyFourHourClubs();
  const pcCount = clubs.filter((club) => inferClubTypeSlugs(club).includes('pc')).length;
  const playStationCount = clubs.filter((club) => inferClubTypeSlugs(club).includes('playstation')).length;
  const districtCounts = new Map<string, { name: string; slug: string; count: number }>();
  for (const club of clubs) {
    if (!club.district?.slug) continue;
    const current = districtCounts.get(club.district.slug);
    districtCounts.set(club.district.slug, { name: club.district.name, slug: club.district.slug, count: (current?.count ?? 0) + 1 });
  }
  const districts = [...districtCounts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'az'));
  const faq = [
    { question: 'Bakıda 24 saat gaming klub varmı?', answer: clubs.length > 0 ? `GameYer-də hazırda həftənin 7 günü 24 saat işlədiyi qeyd olunan ${clubs.length} aktiv gaming klubu göstərilir. İş qrafiki dəyişə bildiyi üçün getməzdən əvvəl klubla dəqiqləşdirmək məsləhətdir.` : 'Hazırda GameYer-də həftənin 7 günü 24 saat işlədiyi təsdiqlənmiş aktiv klub göstərilmir. Məlumatlar yeniləndikcə siyahı avtomatik dəyişir.' },
    { question: 'Gecə açıq PC klubunu necə tapa bilərəm?', answer: '24 saat siyahısından PC seçimi olan klublara baxa, xəritədə məsafəni və klub profilində iş saatlarını yoxlaya bilərsən.' },
    { question: '24 saat PlayStation klubları gecə də eyni tariflə işləyir?', answer: 'Həmişə yox. Bəzi klublarda gecə, paket və VIP tarifləri gündüz saatlıq qiymətlərindən fərqlənə bilər. Dəqiq qiyməti klub profilində yoxla.' },
  ];
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/bakida-24-saat-gaming-klublari`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl }, { '@type': 'ListItem', position: 2, name: 'Bakıda 24 saat gaming klubları', item: pageUrl }] },
      ...(clubs.length > 0 ? [{ '@type': 'ItemList', name: 'Bakıda 24 saat açıq gaming klubları', numberOfItems: clubs.length, itemListElement: clubs.map((club, index) => ({ '@type': 'ListItem', position: index + 1, name: club.name, url: `${siteUrl}/klub/${club.slug}` })) }] : []),
      { '@type': 'FAQPage', mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb"><Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <span>24 saat klublar</span></nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda 24 saat PC, kompüter və PlayStation klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Gecə açıq kompüter klubu, 24 saat PC klub və ya gecə işləyən PlayStation klub axtarırsansa, həftənin 7 günü gecə-gündüz işlədiyi qeyd olunan məkanları burada müqayisə et. Hazırda {clubs.length} klub göstərilir; {pcCount}-i PC, {playStationCount}-ü PlayStation seçimi təqdim edir.</p>

      <div className="mt-5 flex flex-wrap gap-2"><Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Saatlıq qiymətləri müqayisə et</Link><Link href="/bakida-internet-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">Internet klubları</Link><Link href="/?view=map" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">Klubları xəritədə gör</Link></div>

      {districts.length > 0 ? <section className="mt-6" aria-labelledby="night-districts"><h2 id="night-districts" className="font-display text-base font-bold text-ink">24 saat klublar hansı rayonlardadır?</h2><p className="mt-1 text-xs leading-5 text-muted">Gecə gaming üçün uyğun klubların yerləşdiyi rayonlara keç.</p><div className="mt-3 flex flex-wrap gap-2">{districts.map((district) => <Link key={district.slug} href={`/rayon/${district.slug}`} className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-primary">{district.name} ({district.count})</Link>)}</div></section> : null}

      {clubs.length > 0 ? <div className="mt-7"><SeoClubList clubs={clubs} /></div> : <div className="mt-7 rounded-card border border-border bg-surface p-5 text-sm text-muted">Hazırda həftənin 7 günü 24 saat işlədiyi təsdiqlənmiş klub yoxdur. Bütün klublara və xəritəyə bax.</div>}
      <section className="mt-10 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-ink">Gecə açıq gaming klub seçərkən nəyə baxmaq lazımdır?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">24 saat və gecə açıq klub seçərkən ünvanı, xəritədə məsafəni, saatlıq tarifi və iş qrafikini birlikdə yoxla. İş saatları dəyişə bildiyi üçün klub profilində telefon və ya Instagram varsa, gecə getməzdən əvvəl məlumatı dəqiqləşdirmək faydalıdır.</p>
        <div className="mt-4 flex flex-wrap gap-2"><Link href="/bakida-pc-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Bütün PC klubları</Link><Link href="/bakida-playstation-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Bütün PlayStation klubları</Link><Link href="/bakida-ucuz-pc-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Ucuz PC klubları</Link><Link href="/bakida-ucuz-playstation-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Ucuz PlayStation klubları</Link><Link href="/rayon" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Rayon üzrə axtar</Link></div>
      </section>
      <section className="mt-6 rounded-card border border-border bg-surface p-5" aria-labelledby="night-faq-heading"><h2 id="night-faq-heading" className="font-display text-lg font-bold text-ink">24 saat gaming klubları haqqında suallar</h2><div className="mt-4 space-y-4">{faq.map((item) => <div key={item.question}><h3 className="text-sm font-bold text-ink">{item.question}</h3><p className="mt-1 text-sm leading-6 text-muted">{item.answer}</p></div>)}</div></section>
    </div>
  );
}
