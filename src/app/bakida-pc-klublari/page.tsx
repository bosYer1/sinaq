import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

const getPcClubs = cache(() => getClubs({ type: 'pc' }));
const title = 'Bakıda PC və kompüter klubları — qiymətlər və ünvanlar';

function minPcPrice(club: Awaited<ReturnType<typeof getClubs>>[number]) {
  const prices = club.pricing
    .filter((item) => item.club_type?.slug === 'pc' && item.unit === 'saat' && item.price_from > 0)
    .map((item) => item.price_from);
  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}

export async function generateMetadata(): Promise<Metadata> {
  const clubs = await getPcClubs();
  const priced = clubs.filter((club) => Number.isFinite(minPcPrice(club)));
  const minPrice = priced.length ? Math.min(...priced.map(minPcPrice)) : null;
  const description = `Bakıda ${clubs.length} aktiv PC və kompüter klubunu qiymət, ünvan, rayon, iş saatları və xəritə ilə müqayisə et.${minPrice != null ? ` Məlum saatlıq tariflər ${minPrice} AZN-dən başlayır.` : ''}`;
  return {
    title,
    description,
    alternates: { canonical: '/bakida-pc-klublari' },
    robots: clubs.length > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: 'website', locale: 'az_AZ', url: '/bakida-pc-klublari', title: 'Bakıda PC və kompüter klubları | GameYer', description },
    twitter: { card: 'summary', title: 'Bakıda PC və kompüter klubları | GameYer', description },
  };
}

export default async function BakuPcClubsPage() {
  const clubs = await getPcClubs();
  const priced = clubs.filter((club) => Number.isFinite(minPcPrice(club)));
  const minPrice = priced.length ? Math.min(...priced.map(minPcPrice)) : null;
  const districtCounts = new Map<string, { slug: string; name: string; count: number }>();
  for (const club of clubs) {
    if (!club.district?.slug) continue;
    const current = districtCounts.get(club.district.slug);
    districtCounts.set(club.district.slug, { slug: club.district.slug, name: club.district.name, count: (current?.count ?? 0) + 1 });
  }
  const strongDistricts = [...districtCounts.values()].filter((district) => district.count >= 2).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'az'));

  const faq = [
    { question: 'Bakıda PC klub qiymətləri neçə AZN-dən başlayır?', answer: minPrice != null ? `GameYer-də qiyməti məlum aktiv PC klublarında saatlıq tariflər hazırda ${minPrice} AZN-dən başlayır. Zona, paket və saat aralığına görə qiymət dəyişə bilər.` : 'PC klub qiymətləri klub, zona və tarifə görə dəyişir. GameYer-də məlum qiymətlər klub profillərində göstərilir.' },
    { question: 'Yaxın PC klubunu necə tapa bilərəm?', answer: 'GameYer xəritəsində PC filtrini seçərək yaxın məkanlara baxa, sonra rayon, iş saatı və qiymət məlumatlarını müqayisə edə bilərsən.' },
    { question: 'Internet klub və PC klub eyni şeydir?', answer: 'Azərbaycanda internet klub, internet kafe, kompüter klubu və PC klub ifadələri çox vaxt eyni tip gaming məkanı üçün işlədilir.' },
  ];

  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/bakida-pc-klublari`;
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl }, { '@type': 'ListItem', position: 2, name: 'Bakıda PC klubları', item: url }] },
      ...(clubs.length > 0 ? [{ '@type': 'ItemList', name: 'Bakıda PC və kompüter klubları', numberOfItems: clubs.length, itemListElement: clubs.map((club, index) => ({ '@type': 'ListItem', position: index + 1, name: club.name, url: `${siteUrl}/klub/${club.slug}` })) }] : []),
      { '@type': 'FAQPage', mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
    ],
  };

  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
    <nav className="mb-5 text-xs text-muted"><Link href="/">GameYer</Link> / Bakıda PC klubları</nav>
    <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda PC və kompüter klubları</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Bakıda PC klub, kompüter klubu, internet klub və internet-kafe kimi axtarılan gaming məkanlarını bir yerdə müqayisə et. Hazırda {clubs.length} aktiv PC klubu göstərilir.{minPrice != null ? ` Məlum saatlıq tariflər ${minPrice} AZN-dən başlayır.` : ''} Ünvan, xəritə və iş saatlarını klub profilində yoxla.</p>

    <div className="mt-4 flex flex-wrap gap-2">
      <Link href="/bakida-internet-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold">Internet və kompüter klubları</Link>
      <Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold">PC klub qiymətlərini müqayisə et</Link>
      <Link href="/bakida-ucuz-pc-klublari" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Ucuz PC klubları — 2 AZN-dək</Link>
      <Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold">24 saat PC klubları</Link>
    </div>

    {strongDistricts.length > 0 ? <section className="mt-6" aria-labelledby="pc-districts-heading"><h2 id="pc-districts-heading" className="font-display text-base font-bold text-ink">Rayon üzrə PC klubları</h2><p className="mt-1 text-xs leading-5 text-muted">Ən azı 2 aktiv PC klubu olan rayonlara birbaşa keç.</p><div className="mt-3 flex flex-wrap gap-2">{strongDistricts.map((district) => <Link key={district.slug} href={`/rayon/${district.slug}/pc`} className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-primary">{district.name} PC klubları ({district.count})</Link>)}</div></section> : null}

    <div className="mt-7"><SeoClubList clubs={clubs} /></div>

    <section className="mt-10 rounded-card border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-bold">PC klubunu necə seçmək olar?</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Rayonuna yaxınlığı, saatlıq qiyməti, iş saatlarını və klubun xəritədə yerini müqayisə et. “Internet klub” və “internet kafe” axtarırsansa da eyni PC məkanlarını ayrıca internet klubları səhifəsində görə bilərsən.</p>
      <div className="mt-4 flex flex-wrap gap-2"><Link href="/?type=pc&view=map" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">PC klubları xəritədə</Link><Link href="/bakida-internet-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">Internet klubları</Link><Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">PC qiymətləri</Link><Link href="/bakida-ucuz-pc-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">Ucuz PC klubları</Link><Link href="/rayon" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">Rayon üzrə axtar</Link></div>
    </section>

    <section className="mt-6 rounded-card border border-border bg-surface p-5" aria-labelledby="pc-faq-heading"><h2 id="pc-faq-heading" className="font-display text-lg font-bold text-ink">PC klubları haqqında tez-tez verilən suallar</h2><div className="mt-4 space-y-4">{faq.map((item) => <div key={item.question}><h3 className="text-sm font-bold text-ink">{item.question}</h3><p className="mt-1 text-sm leading-6 text-muted">{item.answer}</p></div>)}</div></section>
  </div>;
}
