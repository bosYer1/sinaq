import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

export const dynamic = 'force-dynamic';

const getVegasClubs = cache(() => getClubs({ q: 'Vegas' }));

export async function generateMetadata(): Promise<Metadata> {
  const clubs = await getVegasClubs();
  const indexable = clubs.length >= 2;
  const title = 'Vegas Gaming Center filialları — Bakı';
  const description = clubs.length > 0
    ? `Bakıda ${clubs.length} aktiv Vegas Gaming Center və Vegas Gaming Club filialını müqayisə et. Ünvan, xəritə və mövcud olduqda qiymət və iş saatlarına bax.`
    : 'Bakıda Vegas Gaming Center filiallarını GameYer-də tap.';

  return {
    title,
    description,
    alternates: { canonical: '/vegas-gaming-center' },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      locale: 'az_AZ',
      url: '/vegas-gaming-center',
      title: `${title} | GameYer`,
      description,
    },
  };
}

export default async function VegasGamingCenterPage() {
  const clubs = await getVegasClubs();
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/vegas-gaming-center`;
  const faq = [
    {
      question: 'Vegas Gaming Center filiallarını haradan görə bilərəm?',
      answer: 'Bu səhifə GameYer-də Vegas adına uyğun aktiv Gaming Center və Gaming Club filiallarını bir yerdə göstərir. Filial profilindən ünvan və xəritə məlumatına baxa bilərsən.',
    },
    {
      question: 'Vegas Gaming Center qiymətləri harada göstərilir?',
      answer: 'Qiyməti dərc edilmiş filiallarda saatlıq tariflər klub profilində göstərilir. Məlumat olmayan qiymət uydurulmur.',
    },
    {
      question: 'Mənə yaxın Vegas filialını necə tapa bilərəm?',
      answer: 'Filialların ünvanlarını və xəritədə yerlərini müqayisə et, sonra uyğun klub profilindən marşruta keç.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Vegas Gaming Center filialları', item: pageUrl },
        ],
      },
      ...(clubs.length > 0 ? [{
        '@type': 'ItemList',
        name: 'Vegas Gaming Center və Gaming Club filialları',
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
        <Link href="/">GameYer</Link> / Vegas Gaming Center
      </nav>

      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Vegas Gaming Center və Gaming Club filialları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        Bakıda Vegas Gaming Center və Vegas Gaming Club axtarırsansa, uyğun aktiv filialları burada bir yerdə müqayisə et.
        Hazırda {clubs.length} aktiv filial göstərilir. Ünvan, xəritə, əlaqə və mövcud olduqda qiymət və iş saatı məlumatlarına klub profillərində bax.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/?q=Vegas&view=map" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Vegas filiallarını xəritədə gör</Link>
        <Link href="/bakida-playstation-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">PlayStation klubları</Link>
        <Link href="/bakida-pc-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">PC klubları</Link>
      </div>

      {clubs.length > 0 ? (
        <div className="mt-7"><SeoClubList clubs={clubs} /></div>
      ) : (
        <div className="mt-7 rounded-card border border-border bg-surface p-5 text-sm text-muted">
          Hazırda Vegas adına uyğun aktiv filial görünmür.
        </div>
      )}

      <section className="mt-8" aria-labelledby="vegas-faq-heading">
        <h2 id="vegas-faq-heading" className="font-display text-lg font-bold text-ink">Vegas Gaming Center haqqında suallar</h2>
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
