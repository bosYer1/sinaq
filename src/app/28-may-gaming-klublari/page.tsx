import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

const get28MayClubs = cache(() => getClubs({ q: '28 May' }));

export async function generateMetadata(): Promise<Metadata> {
  const clubs = await get28MayClubs();
  const indexable = clubs.length >= 2;
  const title = '28 Mayda gaming klubları — PC və PlayStation';
  const description = clubs.length > 0
    ? `28 May axtarışına uyğun ${clubs.length} aktiv PC və PlayStation klubunu GameYer-də müqayisə et. Ünvan, xəritə və mövcud olduqda qiymət və iş saatlarına bax.`
    : '28 May ərazisində PC və PlayStation gaming klublarını GameYer-də tap.';
  return {
    title,
    description,
    alternates: { canonical: '/28-may-gaming-klublari' },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: 'website', locale: 'az_AZ', url: '/28-may-gaming-klublari', title: `${title} | GameYer`, description },
  };
}

export default async function TwentyEightMayGamingClubsPage() {
  const clubs = await get28MayClubs();
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/28-may-gaming-klublari`;
  const faq = [
    {
      question: '28 Mayda PC və PlayStation klublarını necə tapa bilərəm?',
      answer: 'Bu səhifə GameYer-də “28 May” axtarışına uyğun aktiv gaming klublarını bir yerdə göstərir. Klub profilindən ünvan və xəritə məlumatına baxa bilərsən.',
    },
    {
      question: '28 May gaming klub qiymətlərini haradan görə bilərəm?',
      answer: 'Qiyməti dərc edilmiş klublarda saatlıq tariflər klub profilində göstərilir. Məlumat olmayan qiymət uydurulmur.',
    },
    {
      question: '28 Mayda internet klub da bu siyahıya daxildir?',
      answer: 'PC, kompüter və internet klub kimi təsnif edilən aktiv gaming məkanları 28 May axtarışına uyğun gəldikdə bu siyahıda görünə bilər.',
    },
  ];
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: '28 May gaming klubları', item: pageUrl },
        ],
      },
      ...(clubs.length > 0 ? [{
        '@type': 'ItemList',
        name: '28 Mayda gaming klubları',
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
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb"><Link href="/">GameYer</Link> / 28 May gaming klubları</nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">28 Mayda PC və PlayStation gaming klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        GameYer-də “28 May” axtarışına uyğun aktiv gaming klublarını bir siyahıda müqayisə et. Hazırda {clubs.length} uyğun klub göstərilir. Ünvan, xəritə, əlaqə və mövcud olduqda qiymət və iş saatı məlumatlarına klub profillərində bax.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/?q=28%20May&view=map" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">28 May klubları xəritədə</Link>
        <Link href="/bakida-pc-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">PC klubları</Link>
        <Link href="/bakida-playstation-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">PlayStation klubları</Link>
      </div>
      {clubs.length > 0 ? (
        <div className="mt-7"><SeoClubList clubs={clubs} /></div>
      ) : (
        <div className="mt-7 rounded-card border border-border bg-surface p-5 text-sm text-muted">Hazırda 28 May axtarışına uyğun aktiv klub görünmür.</div>
      )}
      <section className="mt-8" aria-labelledby="may28-faq-heading">
        <h2 id="may28-faq-heading" className="font-display text-lg font-bold text-ink">28 May gaming klubları haqqında suallar</h2>
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
