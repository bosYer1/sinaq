import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'İstifadəçi razılaşması və istifadə qaydaları',
  description: 'GameYer platformasından istifadə, məlumatların doğruluğu, avtomatlaşdırılmış çıxarış və məlumat toplusunun təkrar istifadəsi qaydaları.',
  alternates: { canonical: '/istifade-qaydalari' },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">← GameYer-ə qayıt</Link>

      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">
        İstifadəçi razılaşması və istifadə qaydaları
      </h1>
      <p className="mt-3 text-sm leading-7 text-muted">Qüvvəyə minmə və son yenilənmə: 27 sentyabr 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">1. Tətbiq sahəsi və razılıq</h2>
          <p className="mt-2">
            Bu qaydalar gameyer.az saytından və GameYer-in təqdim etdiyi əlaqəli funksiyalardan istifadəyə tətbiq olunur.
            Platformadan istifadə etdikdə, qanunvericiliklə ziddiyyət təşkil etmədiyi həddə bu qaydaların tətbiq olunduğunu qəbul edirsiniz.
            Qaydalarla razı deyilsinizsə, platformadan istifadəni dayandıra bilərsiniz.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">2. Platformanın məqsədi</h2>
          <p className="mt-2">
            GameYer istifadəçilərə PC və PlayStation klublarını tapmaq, müqayisə etmək, ünvan, xəritə, qiymət,
            iş saatı və əlaqə məlumatlarına baxmaq imkanı verir. GameYer klubun özü deyil və klub adından xidmət,
            rezervasiya və ya satış öhdəliyi götürmür.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">3. Məlumat toplusu və hüquqlar</h2>
          <p className="mt-2">
            GameYer-də klub məlumatlarının seçilməsi, yoxlanılması, təsnifləşdirilməsi, strukturlaşdırılması,
            əlaqələndirilməsi və yenilənməsi üçün vaxt və resurs sərf olunur. Qanunvericiliyin tətbiq olunduğu həddə
            GameYer məlumat toplusunun quruluşu və məlumat toplusuna qoyulan əhəmiyyətli sərmayə ilə bağlı müəlliflik
            və xüsusi qorunma hüquqlarını saxlayır.
          </p>
          <p className="mt-2">
            Bu qaydalar klub adı, ünvan, telefon kimi ayrıca ictimai faktların, yaxud üçüncü şəxslərə məxsus əmtəə
            nişanlarının, loqoların, fotoların və digər materialların avtomatik olaraq GameYer-ə məxsus olduğunu iddia etmir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">4. Avtomatlaşdırılmış çıxarış və toplu təkrar istifadə</h2>
          <p className="mt-2">
            Qanunla məcburi qaydada icazə verilən hallar istisna olmaqla, GameYer-in əvvəlcədən yazılı icazəsi olmadan
            aşağıdakı hərəkətlərə yol verilmir:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>robot, scraper, crawler, headless browser, skript və ya oxşar vasitə ilə məlumatların kütləvi çıxarılması;</li>
            <li>məlumat toplusunun tam və ya əhəmiyyətli hissəsinin başqa məlumat bazasına, kataloqa, tətbiqə və ya xidmətə köçürülməsi və ya təkrar istifadəsi;</li>
            <li>əhəmiyyətli olmayan hissələrin təkrar və sistemli şəkildə götürülərək GameYer məlumat toplusunu faktiki əvəz edən və ya onun kommersiya dəyərindən istifadə edən toplunun yaradılması;</li>
            <li>GameYer məlumatlarının rəqib kataloq, marketplace, rezervasiya və ya oxşar kommersiya xidmətinin inventarını kütləvi şəkildə yaratmaq və ya zənginləşdirmək üçün istifadəsi;</li>
            <li>rate limit, giriş nəzarəti, bot müdafiəsi və digər texniki mühafizə tədbirlərinin dolanılması, zəiflədilməsi və ya aradan qaldırılmasına cəhd.</li>
          </ul>
          <p className="mt-3">
            Axtarış sistemlərinin normal indeksləmə fəaliyyəti və qanunvericiliklə açıq şəkildə icazə verilən istifadə halları
            bu bölmənin məqsədi ilə qadağan edilmir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">5. Müraciətlər və istifadəçi tərəfindən göndərilən məlumat</h2>
          <p className="mt-2">
            Klub əlavə etdikdə, düzəliş göndərdikdə və ya klub sahibi/nümayəndəsi kimi məlumat təqdim etdikdə,
            təqdim etdiyiniz məlumatın doğru olduğuna vicdanla inanmalı və həmin məlumatı paylaşmaq üçün qanuni əsasınız
            və ya səlahiyyətiniz olmalıdır. Şifrə, SMS kodu, hesab giriş məlumatı və ya paylaşmağa hüququnuz olmayan
            şəxsi məlumat göndərməyin.
          </p>
          <p className="mt-2">
            Müraciət formasında razılıq qutusunu işarələməklə həmin anda qüvvədə olan bu qaydalar və
            <Link href="/mexfilik" className="mx-1 font-semibold text-primary hover:underline">Məxfilik siyasəti</Link>
            ilə tanış olduğunuzu təsdiq edirsiniz.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">6. Məlumatların dəqiqliyi</h2>
          <p className="mt-2">
            Klub qiymətləri, iş saatları, avadanlıq, əlaqə və digər məlumatlar sonradan dəyişə bilər. GameYer məlumatları
            mümkün qədər dəqiq və aktual saxlamağa çalışır, lakin onların hər an tam, səhvsiz və dəyişməz olmasına zəmanət vermir.
            Səfər, ödəniş və ya rezervasiya qərarından əvvəl klubun rəsmi əlaqə kanalından məlumatı dəqiqləşdirmək tövsiyə olunur.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">7. Üçüncü tərəf xidmətləri</h2>
          <p className="mt-2">
            GameYer Instagram, TikTok, telefon, xəritə və digər üçüncü tərəf xidmətlərinə keçid verə bilər. Həmin xidmətlərin
            məzmunu, əlçatanlığı, təhlükəsizliyi və öz qaydaları həmin üçüncü tərəflərin məsuliyyətindədir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">8. Təhlükəsizlik və sui-istifadə</h2>
          <p className="mt-2">
            GameYer təhlükəsizliyi, xidmətin sabitliyini və qanuni maraqları qorumaq üçün şübhəli və ya avtomatlaşdırılmış
            sorğuları məhdudlaşdıra, bloklaya, giriş tezliyini azalda və qanunvericiliyə uyğun texniki qeydlər saxlaya bilər.
            Bu tədbirlər qanunla verilən məcburi istifadə hüquqlarını aradan qaldırmır.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">9. Məsuliyyətin sərhədi</h2>
          <p className="mt-2">
            Qanunvericiliyin icazə verdiyi həddə GameYer platformada yerləşən dəyişkən klub məlumatına, üçüncü tərəf
            xidmətlərinə və istifadəçinin həmin məlumat əsasında verdiyi müstəqil qərarlara görə öz üzərinə qanunda nəzərdə
            tutulmayan əlavə təminat və ya öhdəlik götürmür. Bu bölmə qanunla məhdudlaşdırılması mümkün olmayan istehlakçı
            və digər məcburi hüquqları məhdudlaşdırmır.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">10. Qaydaların dəyişdirilməsi</h2>
          <p className="mt-2">
            Məhsul, təhlükəsizlik tələbləri və ya qanunvericilik dəyişdikdə bu qaydalar yenilənə bilər. Səhifədə son yenilənmə
            tarixi göstərilir. Müraciət zamanı qəbul edilmiş qaydaların versiyası müraciətlə birlikdə qeyd olunur.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">11. Tətbiq olunan hüquq və mübahisələr</h2>
          <p className="mt-2">
            Bu qaydalara Azərbaycan Respublikasının qanunvericiliyi tətbiq olunur. Mübahisə yarandıqda əvvəlcə qarşılıqlı
            əlaqə yolu ilə həllə cəhd edilir; həll mümkün olmadıqda məsələ qanunvericiliklə müəyyən edilmiş səlahiyyətli orqana
            və ya məhkəməyə çıxarıla bilər.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">12. Əlaqə və icazə sorğuları</h2>
          <p className="mt-2">
            Məlumatların istifadəsi, lisenziyalaşdırılması, düzəliş və ya bu qaydalarla bağlı müraciətlər üçün{' '}
            <Link href="/elaqe" className="font-semibold text-primary hover:underline">əlaqə səhifəsindən</Link>{' '}
            istifadə edə bilərsiniz.
          </p>
        </section>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-surface-alt p-5 text-xs leading-6 text-muted">
        Bu qaydalar qanunvericiliklə verilən və müqavilə ilə aradan qaldırıla bilməyən hüquq və istisnaları məhdudlaşdırmaq məqsədi daşımır.
      </div>
    </div>
  );
}
