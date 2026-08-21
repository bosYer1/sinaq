import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { SeoClubList } from '@/components/seo/SeoClubList';

const title = 'Yaxınlıqdakı gaming klubları — PC və PlayStation xəritədə';
const description = 'Yaxınlıqdakı PC, kompüter və PlayStation klublarını tap. Bakı üzrə gaming klublarını rayon, qiymət, iş saatları və xəritədə yerləşməyə görə müqayisə et.';

export async function generateMetadata(): Promise<Metadata> {
  const clubs = await getClubs();
  return {
    title,
    description,
    alternates: { canonical: '/yaxinliqda-gaming-klublari' },
    robots: clubs.length > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      locale: 'az_AZ',
      url: '/yaxinliqda-gaming-klublari',
      title: 'Yaxınlıqdakı gaming klubları | GameYer',
      description: 'Yaxın PC və PlayStation klublarını xəritə, rayon, qiymət və iş saatlarına görə müqayisə et.',
    },
  };
}

export default async function NearbyGamingClubsPage() {
  const clubs = await getClubs();
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/yaxinliqda-gaming-klublari`;
  const pcCount = clubs.filter((club) => inferClubTypeSlugs(club).includes('pc')).length;
  const playStationCount = clubs.filter((club) => inferClubTypeSlugs(club).includes('playstation')).length;
  const districtCounts = new Map<string, { slug: string; name: string; count: number }>();

  for (const club of clubs) {
    if (!club.district?.slug) continue;
    const current = districtCounts.get(club.district.slug);
    districtCounts.set(club.district.slug, {
      slug: club.district.slug,
      name: club.district.name,
      count: (current?.count ?? 0) + 1,
    });
  }

  const districts = [...districtCounts.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'az'))
    .slice(0, 12);

  const faq = [
    {
      question: 'Mənə ən yaxın gaming klubunu necə tapa bilərəm?',
      answer: 'GameYer-in xəritə görünüşünü aç və brauzerdə lokasiya icazəsi ver. Xəritədə yaxınlıqdakı PC və PlayStation klublarını, sonra isə klub profilində ünvan, iş saatı və qiyməti yoxlaya bilərsən.',
    },
    {
      question: 'Yaxın PC və PlayStation klublarını ayrı görə bilərəm?',
      answer: 'Bəli. PC və PlayStation kateqoriya səhifələrindən uyğun klubları ayrıca görə, rayon səhifələrindən isə konkret ərazidə seçimləri daralda bilərsən.',
    },
    {
      question: 'Ən yaxın klub həmişə ən yaxşı seçimdir?',
      answer: 'Mütləq deyil. Məsafə ilə yanaşı saatlıq qiymət, iş saatları və klubun təqdim etdiyi PC və ya PlayStation imkanlarını da müqayisə etmək daha faydalıdır.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Yaxınlıqdakı gaming klubları', item: pageUrl },
        ],
      },
      ...(clubs.length > 0 ? [{
        '@type': 'ItemList',
        name: 'Bakıda yaxınlıqdakı gaming klubları',
        numberOfItems: clubs.length,
        itemListElement: clubs.map((club, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: club.name,
          url: `${siteUrl}/klub/${club.slug}`,
        })),
      }] : []),
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <span>Yaxınlıqdakı gaming klubları</span>
      </nav>

      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Yaxınlıqdakı PC və PlayStation klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        Yaxınlıqda gaming klub, kompüter klubu və ya PlayStation klub axtarırsansa, Bakı üzrə aktiv məkanları burada müqayisə et. Hazırda {clubs.length} klub göstərilir; {pcCount}-i PC, {playStationCount}-ü PlayStation seçimi təqdim edir.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/?view=map" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Yaxın klubları xəritədə tap</Link>
        <Link href="/bakida-pc-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">PC klubları</Link>
        <Link href="/bakida-playstation-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">PlayStation klubları</Link>
        <Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">Qiymətləri müqayisə et</Link>
      </div>

      {districts.length > 0 ? (
        <section className="mt-7" aria-labelledby="nearby-districts-heading">
          <h2 id="nearby-districts-heading" className="font-display text-lg font-bold text-ink">Rayon üzrə yaxın gaming klubları</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Olduğun əraziyə yaxın rayon seçərək nəticələri daralt.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {districts.map((district) => (
              <Link key={district.slug} href={`/rayon/${district.slug}`} className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-primary">
                {district.name} ({district.count})
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {clubs.length > 0 ? <div className="mt-8"><SeoClubList clubs={clubs} /></div> : null}

      <section className="mt-10 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-ink">Yaxın klub seçəndə nəyə baxmaq lazımdır?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Məsafə vacibdir, amma tək meyar deyil. Xəritədə yaxınlığı yoxladıqdan sonra klub profilində saatlıq qiyməti, iş saatlarını, ünvanı və təqdim etdiyi PC və ya PlayStation imkanlarını müqayisə et.</p>
      </section>

      <section className="mt-8" aria-labelledby="nearby-faq-heading">
        <h2 id="nearby-faq-heading" className="font-display text-lg font-bold text-ink">Yaxın gaming klubları haqqında suallar</h2>
        <div className="mt-4 space-y-3">
          {faq.map((item) => (
            <article key={item.question} className="rounded-card border border-border bg-surface p-4">
              <h3 className="font-semibold text-ink">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
