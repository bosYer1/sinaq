import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Klub məlumatlarının yoxlanma metodologiyası',
  description: 'GameYer-də PC və PlayStation klub məlumatlarının hansı mənbələrdən toplandığını, necə yoxlandığını və necə yeniləndiyini öyrən.',
  alternates: { canonical: '/melumat-metodologiyasi' },
};

const steps = [
  ['Məkanın mövcudluğu', 'Klub adı və ünvanı ictimai biznes siyahıları, xəritə məlumatları və mümkün olduqda klubun rəsmi səhifəsi ilə uyğunlaşdırılır.'],
  ['Əlaqə məlumatı', 'Telefon və sosial profil yalnız konkret kluba uyğun gəldiyi təsdiqləndikdə əlavə olunur.'],
  ['İş saatları və qiymət', 'Bu məlumatlar daha tez dəyişdiyi üçün mənbədə görünən cari məlumat kimi saxlanılır və klub sahibinin təsdiqi daha yüksək etibarlılıq siqnalı sayılır.'],
  ['Koordinatlar', 'Dəqiq koordinat mövcuddursa xəritədə marker göstərilir. Koordinatı təsdiqlənməyən klub siyahıda qala bilər, lakin xəritədə yanlış nöqtə göstərilmir.'],
  ['Düzəliş prosesi', 'İstifadəçi və ya klub sahibi səhv məlumat bildirə bilər. Müraciət admin tərəfindən yoxlanıldıqdan sonra profil yenilənir.'],
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-5 text-xs text-muted"><Link href="/" className="hover:text-ink">GameYer</Link> / Məlumat metodologiyası</nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Klub məlumatlarını necə yoxlayırıq?</h1>
      <p className="mt-4 text-sm leading-7 text-muted">GameYer-in məqsədi çox klub göstərməkdən əvvəl düzgün klub göstərməkdir. Buna görə təsdiqlənməyən qiymət, telefon, logo və koordinatı uydurmuruq; həmin sahə məlumat əldə edilənədək boş qala bilər.</p>
      <div className="mt-8 space-y-3">{steps.map(([title, text], index) => <section key={title} className="rounded-card border border-border bg-surface p-5"><p className="text-xs font-semibold text-primary">0{index + 1}</p><h2 className="mt-1 font-display text-base font-bold text-ink">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{text}</p></section>)}</div>
      <section className="mt-8 rounded-card border border-border bg-surface-alt p-5"><h2 className="font-display text-base font-bold text-ink">Səhv məlumat gördünüz?</h2><p className="mt-2 text-sm leading-6 text-muted">Klub səhifəsindəki “Məlumatda səhv var?” keçidindən və ya əlaqə səhifəsindən düzəliş göndərə bilərsiniz.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/elaqe" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Düzəliş göndər</Link><Link href="/klub-sahibi" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Klub məlumatını təsdiqlə</Link></div></section>
    </div>
  );
}
