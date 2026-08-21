import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

const title = 'Bakıda gaming klub qiymətləri — PC və PlayStation saatlıq tariflər';
const description = 'Bakıda PC, kompüter və PlayStation klub qiymətlərini müqayisə et. Saatlıq tariflər, rayon, ünvan, iş saatları və xəritə məlumatlarına GameYer-də bax.';

function minPriceForType(club: Awaited<ReturnType<typeof getClubs>>[number], type: 'pc' | 'playstation') {
  const prices = club.pricing.filter((item) => item.club_type?.slug === type && item.unit === 'saat' && item.price_from > 0).map((item) => item.price_from);
  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}

export async function generateMetadata(): Promise<Metadata> {
  const clubs = await getClubs();
  const hasPricing = clubs.some((club) => Number.isFinite(minPriceForType(club, 'pc')) || Number.isFinite(minPriceForType(club, 'playstation')));
  return {
    title,
    description,
    alternates: { canonical: '/bakida-gaming-klub-qiymetleri' },
    robots: hasPricing ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: 'website', locale: 'az_AZ', url: '/bakida-gaming-klub-qiymetleri', title: 'Bakıda gaming klub qiymətləri | GameYer', description: 'PC və PlayStation klublarının saatlıq qiymətlərini və məkan məlumatlarını müqayisə et.' },
  };
}

export default async function GamingClubPricesPage() {
  const clubs = await getClubs();
  const pricedPc = clubs.filter((club) => Number.isFinite(minPriceForType(club, 'pc'))).sort((a, b) => minPriceForType(a, 'pc') - minPriceForType(b, 'pc'));
  const pricedPs = clubs.filter((club) => Number.isFinite(minPriceForType(club, 'playstation'))).sort((a, b) => minPriceForType(a, 'playstation') - minPriceForType(b, 'playstation'));
  const pcPrices = pricedPc.map((club) => minPriceForType(club, 'pc'));
  const psPrices = pricedPs.map((club) => minPriceForType(club, 'playstation'));
  const pcMin = pcPrices.length ? Math.min(...pcPrices) : null;
  const pcMax = pcPrices.length ? Math.max(...pcPrices) : null;
  const psMin = psPrices.length ? Math.min(...psPrices) : null;
  const psMax = psPrices.length ? Math.max(...psPrices) : null;

  const districtMap = new Map<string, { name: string; slug: string; pc: number[]; ps: number[] }>();
  for (const club of clubs) {
    if (!club.district?.slug) continue;
    const row = districtMap.get(club.district.slug) ?? { name: club.district.name, slug: club.district.slug, pc: [], ps: [] };
    const pcPrice = minPriceForType(club, 'pc');
    const psPrice = minPriceForType(club, 'playstation');
    if (Number.isFinite(pcPrice)) row.pc.push(pcPrice);
    if (Number.isFinite(psPrice)) row.ps.push(psPrice);
    districtMap.set(club.district.slug, row);
  }
  const districtPrices = [...districtMap.values()].filter((row) => row.pc.length || row.ps.length).sort((a, b) => a.name.localeCompare(b.name, 'az'));

  const faq = [
    { question: 'Bakıda PC klubun saatlıq qiyməti nə qədərdir?', answer: pcMin != null && pcMax != null ? `GameYer-də hazırda qiyməti məlum PC klublarında saatlıq tariflər ${pcMin}–${pcMax} AZN aralığındadır. Tarif klub, zona və saat aralığına görə dəyişə bilər.` : 'Qiymətlər klub və kompüter zonasına görə dəyişir. GameYer yalnız məlum və daxil edilmiş tarifləri göstərir.' },
    { question: 'Bakıda PlayStation klubun saatlıq qiyməti nə qədərdir?', answer: psMin != null && psMax != null ? `GameYer-də hazırda qiyməti məlum PlayStation klublarında saatlıq tariflər ${psMin}–${psMax} AZN aralığındadır. PS4, PS5 və VIP otaq qiymətləri fərqli ola bilər.` : 'PlayStation qiymətləri konsol modeli və otaq tipinə görə dəyişir. Mövcud tariflər klub profilində göstərilir.' },
    { question: 'Ən ucuz gaming klubu necə tapa bilərəm?', answer: 'Ucuz PC və ucuz PlayStation siyahılarından başlaya, sonra rayon, xəritə, iş saatı və klub profilindəki tarif məlumatlarını müqayisə edə bilərsən.' },
    { question: 'GameYer-də göstərilən qiymətlər son qiymətdir?', answer: 'Qiymətlər klubun təqdim etdiyi və ya GameYer-də mövcud olan məlum tariflərdir. Kampaniya, gecə paketi və zona qiymətləri dəyişə bildiyi üçün getməzdən əvvəl klub profilindəki əlaqə məlumatı ilə dəqiqləşdirmək faydalıdır.' },
  ];

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/bakida-gaming-klub-qiymetleri`;
  const uniquePricedClubs = Array.from(new Map([...pricedPc, ...pricedPs].map((club) => [club.id, club])).values());
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl }, { '@type': 'ListItem', position: 2, name: 'Gaming klub qiymətləri', item: pageUrl }] },
      { '@type': 'ItemList', name: 'Bakıda qiyməti məlum gaming klubları', numberOfItems: uniquePricedClubs.length, itemListElement: uniquePricedClubs.map((club, index) => ({ '@type': 'ListItem', position: index + 1, name: club.name, url: `${siteUrl}/klub/${club.slug}` })) },
      { '@type': 'FAQPage', mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb"><Link href="/">GameYer</Link> / Gaming klub qiymətləri</nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda gaming klub qiymətləri</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Bakıda PC, kompüter və PlayStation klublarının məlum saatlıq tariflərini müqayisə et. Qiymətlər klubun zona, konsol və tarifinə görə dəyişə bilər; son detalları hər klubun profilində yoxla.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <section className="rounded-card border border-border bg-surface p-5"><h2 className="font-display text-lg font-bold text-ink">PC klub qiymətləri</h2><p className="mt-2 text-sm text-muted">{pcMin != null && pcMax != null ? `Mövcud saatlıq PC tarifləri ${pcMin}–${pcMax} AZN aralığındadır.` : 'Hazırda təsdiqlənmiş PC qiyməti yoxdur.'}</p><Link href="/bakida-pc-klublari" className="mt-3 inline-flex text-sm font-semibold text-primary">Bütün PC klubları →</Link></section>
        <section className="rounded-card border border-border bg-surface p-5"><h2 className="font-display text-lg font-bold text-ink">PlayStation klub qiymətləri</h2><p className="mt-2 text-sm text-muted">{psMin != null && psMax != null ? `Mövcud saatlıq PlayStation tarifləri ${psMin}–${psMax} AZN aralığındadır.` : 'Hazırda təsdiqlənmiş PlayStation qiyməti yoxdur.'}</p><Link href="/bakida-playstation-klublari" className="mt-3 inline-flex text-sm font-semibold text-primary">Bütün PlayStation klubları →</Link></section>
      </div>

      {districtPrices.length > 0 ? <section className="mt-7 rounded-card border border-border bg-surface p-5" aria-labelledby="district-price-heading"><h2 id="district-price-heading" className="font-display text-lg font-bold text-ink">Rayonlara görə gaming klub qiymətləri</h2><p className="mt-1 text-xs leading-5 text-muted">Qiyməti məlum klubların rayon üzrə ən aşağı saatlıq tariflərinə bax.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{districtPrices.map((district) => <Link key={district.slug} href={`/rayon/${district.slug}`} className="rounded-control border border-border px-3 py-3 text-sm text-ink hover:border-primary"><span className="font-semibold">{district.name}</span><span className="mt-1 block text-xs text-muted">{district.pc.length ? `PC ${Math.min(...district.pc)} AZN-dən` : 'PC qiyməti yoxdur'} · {district.ps.length ? `PS ${Math.min(...district.ps)} AZN-dən` : 'PS qiyməti yoxdur'}</span></Link>)}</div></section> : null}

      <div className="mt-5 flex flex-wrap gap-2"><Link href="/bakida-ucuz-pc-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">Ucuz PC klubları</Link><Link href="/bakida-ucuz-playstation-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">Ucuz PlayStation klubları</Link><Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">24 saat klublar</Link><Link href="/rayon" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">Rayona görə tap</Link></div>

      {pricedPc.length > 0 ? <section className="mt-9"><h2 className="mb-4 font-display text-xl font-bold text-ink">Qiyməti məlum PC klubları</h2><SeoClubList clubs={pricedPc} /></section> : null}
      {pricedPs.length > 0 ? <section className="mt-9"><h2 className="mb-4 font-display text-xl font-bold text-ink">Qiyməti məlum PlayStation klubları</h2><SeoClubList clubs={pricedPs} /></section> : null}

      <section className="mt-10 rounded-card border border-border bg-surface p-5"><h2 className="font-display text-lg font-bold text-ink">Gaming klub qiyməti nədən asılıdır?</h2><p className="mt-2 text-sm leading-6 text-muted">PC klublarında kompüter zonası, monitor və avadanlıq səviyyəsi, PlayStation məkanlarında isə konsol modeli və VIP otaq qiymətə təsir edə bilər. Gecə paketləri və uzunmüddətli tariflər də standart saatlıq qiymətdən fərqli ola bilər.</p></section>

      <section className="mt-6 rounded-card border border-border bg-surface p-5" aria-labelledby="price-faq-heading">
        <h2 id="price-faq-heading" className="font-display text-lg font-bold text-ink">Gaming klub qiymətləri haqqında suallar</h2>
        <div className="mt-4 space-y-4">{faq.map((item) => <div key={item.question}><h3 className="text-sm font-bold text-ink">{item.question}</h3><p className="mt-1 text-sm leading-6 text-muted">{item.answer}</p></div>)}</div>
      </section>
    </div>
  );
}
