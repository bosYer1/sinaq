import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

const description = 'Bakıda PC klub, kompüter klubu və internet klub axtarırsan? Aktiv gaming məkanlarını ünvan, rayon və xəritə ilə GameYer-də müqayisə et.';

function landingSignals(clubs: Awaited<ReturnType<typeof getClubs>>) {
  const hourlyPrices = clubs.flatMap((club) => club.pricing ?? []).filter((price) => price.unit === 'saat' && price.price_from > 0).map((price) => price.price_from);
  return {
    minimumPrice: hourlyPrices.length > 0 ? Math.min(...hourlyPrices) : null,
    hasHours: clubs.some((club) => (club.opening_hours ?? []).some((hours) => Boolean(hours.open_time) && !hours.is_closed)),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const clubs = await getClubs({ type: 'pc' });
  const { minimumPrice, hasHours } = landingSignals(clubs);
  const title = minimumPrice !== null
    ? 'Bakıda PC və kompüter klubları — qiymətlər və ünvanlar'
    : 'Bakıda PC və kompüter klubları — ünvan və xəritə';
  const facts = [
    minimumPrice !== null ? `saatlıq qiymətlər ${minimumPrice} AZN-dən başlayır` : null,
    hasHours ? 'iş saatları olan profilləri yoxla' : null,
  ].filter((item): item is string => Boolean(item));
  const dynamicDescription = clubs.length > 0
    ? `Bakıda ${clubs.length} PC və kompüter klubunu müqayisə et. Ünvan, rayon və xəritə məlumatlarına bax${facts.length > 0 ? `; ${facts.join(', ')}` : ''}.`
    : description;
  return {
    title,
    description: dynamicDescription,
    alternates: { canonical: '/bakida-pc-klublari' },
    robots: clubs.length > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      locale: 'az_AZ',
      url: '/bakida-pc-klublari',
      title: 'Bakıda PC və kompüter klubları | GameYer',
      description: dynamicDescription,
    },
  };
}

export default async function BakuPcClubsPage() {
  const clubs = await getClubs({ type: 'pc' });
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/bakida-pc-klublari`;
  const districtCounts = new Map<string, { slug: string; name: string; count: number }>();
  const { minimumPrice } = landingSignals(clubs);

  for (const club of clubs) {
    if (!club.district?.slug) continue;
    const current = districtCounts.get(club.district.slug);
    districtCounts.set(club.district.slug, { slug: club.district.slug, name: club.district.name, count: (current?.count ?? 0) + 1 });
  }

  const strongDistricts = [...districtCounts.values()].filter((district) => district.count >= 2).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'az'));
  const faq = [
    { question: 'Bakıda PC klub qiymətləri neçə AZN-dən başlayır?', answer: minimumPrice !== null ? `GameYer-də hazırda göstərilən PC klublarında saatlıq qiymətlər ${minimumPrice} AZN-dən başlayır. Konkret klub profilində aktual tarifləri yoxla.` : 'Saatlıq qiymətlər klubdan və zonadan asılıdır. Qiymət məlumatı olan klubları GameYer-də müqayisə edə bilərsən.' },
    { question: 'Mənə yaxın PC klubunu necə tapa bilərəm?', answer: 'Yaxın klublar səhifəsindən xəritəyə keçərək lokasiyana yaxın PC klublarını görə bilərsən. Rayon səhifələri də konkret ərazidə seçimləri daraltmağa kömək edir.' },
    { question: 'PC klub və internet klub eyni şeydir?', answer: 'Axtarışlarda bu terminlər tez-tez eyni tip gaming məkanları üçün işlədilir. GameYer PC və internet klub kimi tanınan məkanları PC kateqoriyasında bir yerdə göstərir.' },
  ];
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl }, { '@type': 'ListItem', position: 2, name: 'Bakıda PC klubları', item: url }] },
      { '@type': 'ItemList', name: 'Bakıda PC və kompüter klubları', numberOfItems: clubs.length, itemListElement: clubs.map((club, index) => ({ '@type': 'ListItem', position: index + 1, name: club.name, url: `${siteUrl}/klub/${club.slug}` })) },
      { '@type': 'FAQPage', mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
    ],
  };

  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
    <nav className="mb-5 text-xs text-muted"><Link href="/">GameYer</Link> / Bakıda PC klubları</nav>
    <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda PC və kompüter klubları</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Bakıda PC klub, kompüter klubu, internet klub və internet-kafe kimi axtarılan gaming məkanlarını bir yerdə müqayisə et. Hazırda {clubs.length} PC klubu göstərilir{minimumPrice !== null ? ` və saatlıq qiymətlər ${minimumPrice} AZN-dən başlayır` : ''}. Klub səhifəsindən ünvanı, xəritəni və mövcud olduqda iş saatı və saatlıq qiymət məlumatlarını yoxlaya bilərsən.</p>

    <div className="mt-4 flex flex-wrap gap-2">
      <Link href="/yaxinliqda-gaming-klublari" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Mənə yaxın PC klubları</Link>
      <Link href="/bakida-internet-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold">Internet və kompüter klubları</Link>
      <Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold">PC klub qiymətlərini müqayisə et</Link>
      <Link href="/bakida-ucuz-pc-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold">Ucuz PC klubları — 2 AZN-dək</Link>
      <Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold">24 saat PC klubları</Link>
    </div>

    {strongDistricts.length > 0 ? <section className="mt-6" aria-labelledby="pc-districts-heading"><h2 id="pc-districts-heading" className="font-display text-base font-bold text-ink">Rayon üzrə PC klubları</h2><p className="mt-1 text-xs leading-5 text-muted">Ən azı 2 aktiv PC klubu olan rayonlara birbaşa keç.</p><div className="mt-3 flex flex-wrap gap-2">{strongDistricts.map((district) => <Link key={district.slug} href={`/rayon/${district.slug}/pc`} className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-primary">{district.name} PC klubları ({district.count})</Link>)}</div></section> : null}

    <div className="mt-7"><SeoClubList clubs={clubs} /></div>
    <section className="mt-10 rounded-card border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-bold">PC klubunu necə seçmək olar?</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Rayonuna yaxınlığı, mövcud olduqda saatlıq qiyməti və iş saatlarını, həmçinin klubun xəritədə yerini müqayisə et. “Internet klub” və “internet kafe” axtarırsansa da eyni PC məkanlarını ayrıca internet klubları səhifəsində görə bilərsən.</p>
      <div className="mt-4 flex flex-wrap gap-2"><Link href="/?type=pc&view=map" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">PC klubları xəritədə</Link><Link href="/yaxinliqda-gaming-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">Yaxın klublar</Link><Link href="/bakida-internet-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">Internet klubları</Link><Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">PC qiymətləri</Link><Link href="/bakida-ucuz-pc-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">Ucuz PC klubları</Link><Link href="/rayon" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">Rayon üzrə axtar</Link></div>
    </section>
    <section className="mt-8" aria-labelledby="pc-faq-heading"><h2 id="pc-faq-heading" className="font-display text-lg font-bold text-ink">PC klubları haqqında suallar</h2><div className="mt-4 space-y-3">{faq.map((item) => <article key={item.question} className="rounded-card border border-border bg-surface p-4"><h3 className="font-semibold text-ink">{item.question}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p></article>)}</div></section>
  </div>;
}
