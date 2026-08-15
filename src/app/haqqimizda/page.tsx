import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'GameYer haqqında',
  description: 'GameYer Bakıda PC və PlayStation klublarını bir yerdə tapmaq, müqayisə etmək və xəritədə görmək üçün yaradılmış gaming klub platformasıdır.',
  alternates: { canonical: '/haqqimizda' },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-5 text-xs text-muted"><Link href="/" className="hover:text-ink">GameYer</Link> / Haqqımızda</nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">GameYer haqqında</h1>
      <p className="mt-4 text-sm leading-7 text-muted">GameYer Bakıda PC, kompüter və PlayStation klublarını bir kataloq və xəritədə birləşdirən yerli gaming platformasıdır. Məqsədimiz oyunçuların klub axtararkən ünvan, rayon, iş saatı, qiymət və əlaqə məlumatını ayrı-ayrı mənbələrdə axtarmasına ehtiyacı azaltmaqdır.</p>
      <p className="mt-4 text-sm leading-7 text-muted">Platformadakı məlumatlar ictimai biznes mənbələri, klubların rəsmi kanalları və klub sahiblərinin təqdim etdiyi məlumatlar əsasında toplanır. Məlumat dəyişdikdə istifadəçilər və klub sahibləri düzəliş göndərə bilirlər.</p>
      <section className="mt-8 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-ink">Məlumat necə yoxlanılır?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Klubun adı və yerləşməsi mümkün olduqda birdən çox ictimai mənbə ilə uyğunlaşdırılır. Sahib və ya rəsmi nümayəndə tərəfindən təsdiqlənən profillər ayrıca təsdiq nişanı alır. Qiymət və iş saatları dəyişə bildiyi üçün klub səhifəsində son yenilənmə tarixi göstərilir.</p>
        <Link href="/melumat-metodologiyasi" className="mt-4 inline-flex rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink hover:border-primary">Məlumat metodologiyasına bax</Link>
      </section>
      <div className="mt-8 flex flex-wrap gap-2"><Link href="/" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Klubları tap</Link><Link href="/klub-sahibi" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Klub sahibiyəm</Link><Link href="/elaqe" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Əlaqə</Link></div>
    </div>
  );
}
