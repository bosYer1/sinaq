import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'İstifadə qaydaları və məlumat toplusunun qorunması',
  description: 'GameYer saytından istifadə, avtomatlaşdırılmış məlumat çıxarılması və məlumat toplusunun təkrar istifadəsi qaydaları.',
  alternates: { canonical: '/istifade-qaydalari' },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        ← GameYer-ə qayıt
      </Link>

      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">
        İstifadə qaydaları və məlumat toplusunun qorunması
      </h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        Son yenilənmə: 27 sentyabr 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">1. Ümumi istifadə</h2>
          <p className="mt-2">
            GameYer istifadəçilərə PC və PlayStation klublarını tapmaq, müqayisə etmək və
            ictimai şəkildə təqdim edilən klub məlumatlarına baxmaq imkanı verir. Saytdan adi şəxsi
            istifadə, klub profillərinə baxış və GameYer-in təqdim etdiyi keçidlərdən istifadə
            bu qaydalar çərçivəsində sərbəstdir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">2. Məlumat toplusu</h2>
          <p className="mt-2">
            GameYer-də klub məlumatlarının seçilməsi, yoxlanılması, təsnifləşdirilməsi, strukturlaşdırılması,
            əlaqələndirilməsi və yenilənməsi üçün vaxt və resurs sərf olunur. GameYer qanunvericiliklə
            nəzərdə tutulan müəlliflik və məlumat toplusuna dair xüsusi qorunma hüquqlarını saxlayır.
          </p>
          <p className="mt-2">
            Bu müddəa ayrı-ayrı ictimai faktlar, üçüncü şəxslərin əmtəə nişanları, loqoları, fotoları
            və ya onlara məxsus digər materiallar üzərində GameYer-ə aid olmayan hüquqların GameYer-ə
            məxsus olduğunu bildirmir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">3. Avtomatlaşdırılmış çıxarış və scraping</h2>
          <p className="mt-2">
            GameYer-in əvvəlcədən yazılı icazəsi olmadan aşağıdakı hərəkətlərə yol verilmir:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>robot, scraper, crawler, headless browser, skript və ya oxşar vasitə ilə klub məlumatlarının kütləvi çıxarılması;</li>
            <li>məlumat toplusunun tam və ya əhəmiyyətli hissəsinin başqa məlumat bazasına, kataloqa, tətbiqə və ya xidmətə köçürülməsi;</li>
            <li>ayrı-ayrı kiçik hissələrin təkrar və sistemli şəkildə götürülərək GameYer məlumat toplusunu əvəz edən və ya onun kommersiya dəyərindən istifadə edən toplunun yaradılması;</li>
            <li>GameYer məlumatlarının rəqib kataloq, marketplace, rezervasiya və ya oxşar kommersiya xidmətinin inventarını yaratmaq və ya zənginləşdirmək üçün kütləvi təkrar istifadəsi;</li>
            <li>rate limit, giriş nəzarəti, bot müdafiəsi və digər texniki mühafizə tədbirlərinin dolanılması və ya pozulmasına cəhd.</li>
          </ul>
          <p className="mt-3">
            Axtarış sistemlərinin qanuni və normal indeksləmə fəaliyyəti, habelə qanunvericiliklə
            açıq şəkildə icazə verilən hallar bu müddəanın məqsədi ilə qadağan edilmir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">4. Təkrar istifadə və istinad</h2>
          <p className="mt-2">
            Ayrı-ayrı məlumatlara istinad edilməsi məlumat toplusunun kütləvi surətdə köçürülməsi
            üçün icazə sayılmır. GameYer məlumatlarını kommersiya məqsədilə toplu şəkildə istifadə
            etmək istəyən şəxs əvvəlcədən yazılı icazə almalıdır.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">5. Texniki və hüquqi müdafiə</h2>
          <p className="mt-2">
            GameYer təhlükəsizlik, sui-istifadənin qarşısının alınması və hüquqların müdafiəsi üçün
            giriş tezliyini məhdudlaşdıra, avtomatlaşdırılmış sorğuları bloklaya və qanunvericiliyə
            uyğun texniki qeydləri saxlaya bilər. Qaydaların və ya tətbiq olunan hüquqların pozulması
            halında GameYer qanunvericiliklə nəzərdə tutulan müdafiə vasitələrindən istifadə etmək
            hüququnu saxlayır.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">6. Məlumatların dəqiqliyi</h2>
          <p className="mt-2">
            Klub qiymətləri, iş saatları və digər məlumatlar dəyişə bilər. GameYer məlumatları
            mümkün qədər dəqiq saxlamağa çalışır, lakin getməzdən və ya rezervasiya barədə qərar
            verməzdən əvvəl klubun rəsmi əlaqə kanalından məlumatı dəqiqləşdirmək tövsiyə olunur.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">7. Əlaqə və icazə sorğuları</h2>
          <p className="mt-2">
            Məlumatların istifadəsi, lisenziyalaşdırılması və ya bu qaydalarla bağlı müraciətlər üçün{' '}
            <Link href="/elaqe" className="font-semibold text-primary hover:underline">
              əlaqə səhifəsindən
            </Link>{' '}
            müraciət edə bilərsiniz.
          </p>
        </section>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-surface-alt p-5 text-xs leading-6 text-muted">
        Bu qaydalar qüvvədə olan məcburi qanunvericiliklə verilən hüquq və istisnaları məhdudlaşdırmaq
        məqsədi daşımır.
      </div>
    </div>
  );
}
