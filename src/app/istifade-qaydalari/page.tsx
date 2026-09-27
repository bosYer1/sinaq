import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'İstifadəçi razılaşması və istifadə qaydaları',
  description: 'GameYer xidmətindən istifadə, klub məlumatları, üçüncü tərəf keçidləri, məlumat toplusunun qorunması və qadağan edilmiş istifadə qaydaları.',
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
        İstifadəçi razılaşması və istifadə qaydaları
      </h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        Son yenilənmə: 27 sentyabr 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">1. Razılaşmanın predmeti və qəbul edilməsi</h2>
          <p className="mt-2">
            Bu qaydalar gameyer.az saytından və GameYer tərəfindən təqdim edilən ictimai funksiyalardan
            istifadə şərtlərini müəyyən edir. Saytdan istifadə etdiyiniz halda bu qaydalarla tanış olduğunuzu
            və onlara əməl etməyə razı olduğunuzu bildirirsiniz. Qaydalarla razı deyilsinizsə, saytdan istifadəyə
            davam etməməlisiniz.
          </p>
          <p className="mt-2">
            Məcburi qanunvericiliklə istifadəçiyə verilən və müqavilə ilə məhdudlaşdırılması mümkün olmayan
            hüquqlar bu razılaşma ilə aradan qaldırılmır.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">2. GameYer nə edir</h2>
          <p className="mt-2">
            GameYer PC və PlayStation klublarını tapmaq və müqayisə etmək üçün məlumat və keçid platformasıdır.
            Klub profillərində ad, ünvan, xəritə mövqeyi, qiymət, iş saatı, avadanlıq, telefon və sosial şəbəkə
            kimi məlumatlar göstərilə bilər.
          </p>
          <p className="mt-2">
            GameYer klubun özü deyil və ayrıca açıq şəkildə göstərilmədiyi halda istifadəçi ilə klub arasında
            yaranan rezervasiya, xidmət, ödəniş və ya digər müqavilənin tərəfi deyil. Telefon, WhatsApp, Instagram,
            TikTok və xəritə keçidləri istifadəçini üçüncü tərəf xidmətinə və ya klubun əlaqə kanalına yönləndirir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">3. Klub məlumatlarının mənbəyi və dəqiqliyi</h2>
          <p className="mt-2">
            Klub məlumatları klubun özü, rəsmi sosial şəbəkə hesabları, ictimai mənbələr, istifadəçi müraciətləri
            və GameYer-in yoxlama prosesi əsasında formalaşa bilər. Qiymət, iş saatı, avadanlıq, əlaqə məlumatı və
            digər göstəricilər sonradan dəyişə bilər.
          </p>
          <p className="mt-2">
            GameYer məlumatların mümkün qədər dəqiq və aktual saxlanmasına çalışır, lakin hər bir məlumatın hər an
            dəyişməz və səhvsiz olmasına zəmanət vermir. Yola düşməzdən, ödəniş etməzdən və ya rezervasiya barədə
            qərar verməzdən əvvəl vacib məlumatı klubun rəsmi əlaqə kanalından dəqiqləşdirmək məqsədəuyğundur.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">4. Məlumat toplusunun və GameYer materiallarının qorunması</h2>
          <p className="mt-2">
            GameYer klub məlumatlarının seçilməsi, toplanması, yoxlanılması, təsnifləşdirilməsi, əlaqələndirilməsi,
            strukturlaşdırılması, təqdim edilməsi və yenilənməsi üçün vaxt, əmək və digər resurslar sərf edir.
            Qanunvericiliyin şərtləri mövcud olduqda məlumat toplusunun quruluşuna müəlliflik hüququ və məzmununa
            dair xüsusi qorunma hüquqları tətbiq oluna bilər.
          </p>
          <p className="mt-2">
            GameYer tərəfindən yaradılmış mətnlər, dizayn elementləri, proqram təminatı və digər orijinal materiallar
            tətbiq olunan əqli mülkiyyət qanunvericiliyi ilə qoruna bilər. Bununla yanaşı, ayrı-ayrı ictimai faktların,
            klub adlarının, üçüncü şəxslərə məxsus əmtəə nişanlarının, loqoların, fotoların və digər materialların
            GameYer-ə məxsus olduğu iddia edilmir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">5. Avtomatlaşdırılmış çıxarış və kütləvi təkrar istifadə</h2>
          <p className="mt-2">
            Qanunvericiliyin birbaşa icazə verdiyi hallar istisna olmaqla, GameYer-in əvvəlcədən yazılı icazəsi olmadan
            aşağıdakı hərəkətlərə yol verilmir:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>robot, scraper, crawler, headless browser, skript və ya oxşar vasitə ilə klub məlumatlarının kütləvi və ya sistemli çıxarılması;</li>
            <li>məlumat toplusunun tam və ya kəmiyyət və ya keyfiyyət baxımından əhəmiyyətli hissəsinin başqa məlumat bazasına, kataloqa, tətbiqə və ya xidmətə köçürülməsi;</li>
            <li>əhəmiyyətli olmayan hissələrin təkrar və sistemli şəkildə götürülməsi nəticəsində GameYer toplusunu əvəz edən, onun normal istifadəsinə zidd olan və ya istehsalçının qanuni maraqlarına əsassız zərər vuran toplunun yaradılması;</li>
            <li>GameYer məlumatlarının rəqib kataloq, marketplace, rezervasiya və ya oxşar kommersiya xidmətinin inventarını kütləvi şəkildə yaratmaq və ya zənginləşdirmək üçün təkrar istifadəsi;</li>
            <li>rate limit, giriş nəzarəti, bot müdafiəsi və digər texniki mühafizə tədbirlərinin dolanılması, zəiflədilməsi və ya buna cəhd edilməsi.</li>
          </ul>
          <p className="mt-3">
            Adi brauzer istifadəsi, ayrı-ayrı məlumatlara baxış, qanuni axtarış sistemi indekslənməsi və tətbiq olunan
            qanunvericilikdə nəzərdə tutulan istisnalar bu bəndlə qadağan edilmir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">6. İcazə verilən və qadağan olunan istifadə</h2>
          <p className="mt-2">
            Saytdan şəxsi məlumatlandırma, klub axtarışı, müqayisə və qanuni istinad məqsədləri üçün istifadə edə bilərsiniz.
            Saytın işini pozmaq, təhlükəsizlik tədbirlərini sınaqdan keçirmək və ya aşmaq üçün icazəsiz müdaxilə etmək,
            zərərli kod yaymaq, saxta müraciətlər göndərmək, həddindən artıq avtomatlaşdırılmış sorğularla xidməti yükləmək
            və ya başqa şəxsin hüquqlarını pozmaq qadağandır.
          </p>
          <p className="mt-2">
            Ayrı-ayrı məlumatlara qanuni istinad edilməsi məlumat toplusunun kütləvi surətdə köçürülməsi və ya kommersiya
            məqsədilə yenidən qurulması üçün ümumi lisenziya hesab edilmir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">7. İstifadəçi və klub müraciətləri</h2>
          <p className="mt-2">
            GameYer-ə klub əlavə edilməsi, məlumat düzəlişi və digər müraciət göndərərkən təqdim etdiyiniz məlumatın
            doğru olduğuna və onu təqdim etməyə hüququnuz olduğuna əmin olmalısınız. Şifrə, birdəfəlik SMS kodu, bank kartı
            məlumatı və ya başqa şəxsin məxfi giriş məlumatlarını göndərməyin.
          </p>
          <p className="mt-2">
            GameYer müraciəti yoxlamaq, dəqiqləşdirmək, qəbul etmək, rədd etmək və ya əlavə sübut istəmək hüququnu saxlayır.
            Müraciət formasında şəxsi məlumatların istifadəsi barədə əlavə məlumat{' '}
            <Link href="/mexfilik" className="font-semibold text-primary hover:underline">
              Məxfilik siyasətində
            </Link>{' '}
            verilir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">8. Üçüncü tərəf xidmətləri və məzmunu</h2>
          <p className="mt-2">
            GameYer xəritə, sosial şəbəkə, analitika, telefon və digər üçüncü tərəf xidmətlərinə keçid verə bilər.
            Həmin xidmətlər GameYer-dən müstəqil qayda və məxfilik siyasətlərinə malikdir. Üçüncü tərəf saytının və ya
            klubun xidmətinin məzmunu, əlçatanlığı, qiyməti və davranışı üzərində GameYer tam nəzarət həyata keçirmir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">9. Texniki müdafiə və xidmətə giriş</h2>
          <p className="mt-2">
            GameYer xidmətin təhlükəsizliyi, əlçatanlığı, sui-istifadənin qarşısının alınması və hüquqların müdafiəsi üçün
            sorğu tezliyini məhdudlaşdıra, şübhəli avtomatlaşdırılmış sorğuları bloklaya, texniki qeydlər saxlaya və
            təhlükəsizlik tədbirləri tətbiq edə bilər. Bu tədbirlər qanunvericiliyə və GameYer-in məxfilik öhdəliklərinə
            uyğun tətbiq edilməlidir.
          </p>
          <p className="mt-2">
            Planlaşdırılmış və ya fövqəladə texniki işlər, təhlükəsizlik hadisələri və üçüncü tərəf xidmətlərində nasazlıq
            səbəbilə saytın bütün funksiyalarının fasiləsiz əlçatan olacağına zəmanət verilmir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">10. Məsuliyyətin sərhədləri</h2>
          <p className="mt-2">
            Qanunvericiliyin yol verdiyi həddə GameYer məlumat xarakterli platforma kimi təqdim olunur. İstifadəçinin klub
            seçimi, kluba səfəri, klubla bağladığı razılaşma, üçüncü tərəf xidmətindən istifadəsi və ya həmin tərəflə ödənişi
            üzrə qərarı istifadəçinin və müvafiq üçüncü tərəfin məsuliyyətindədir.
          </p>
          <p className="mt-2">
            Bu bənd GameYer-in qanunla istisna edilməsi mümkün olmayan məsuliyyətini aradan qaldırmır və istehlakçıya
            məcburi qanunvericiliklə verilən hüquqları məhdudlaşdırmır.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">11. Qaydaların dəyişdirilməsi</h2>
          <p className="mt-2">
            GameYer xidmətin, təhlükəsizlik tədbirlərinin və ya tətbiq olunan hüquqi tələblərin dəyişməsi ilə əlaqədar
            bu qaydaları yeniləyə bilər. Cari versiya bu səhifədə son yenilənmə tarixi ilə dərc olunur. Dəyişikliklər
            qanunvericiliyin tələb etdiyi hallarda əvvəlcədən əlavə bildirişlə təqdim edilə bilər.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">12. Tətbiq olunan hüquq və əlaqə</h2>
          <p className="mt-2">
            Bu qaydalar məcburi kolliziya normaları və istifadəçinin qanunla qorunan hüquqları nəzərə alınmaqla Azərbaycan
            Respublikasının tətbiq olunan qanunvericiliyi çərçivəsində şərh edilir.
          </p>
          <p className="mt-2">
            Məlumatların istifadəsi, lisenziyalaşdırılması, hüquq pozuntusu bildirişi və ya bu qaydalarla bağlı müraciətlər üçün{' '}
            <Link href="/elaqe" className="font-semibold text-primary hover:underline">
              əlaqə səhifəsindən
            </Link>{' '}
            müraciət edə bilərsiniz.
          </p>
        </section>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-surface-alt p-5 text-xs leading-6 text-muted">
        Bu qaydalar ayrıca hüquqi məsləhət deyil və qüvvədə olan məcburi qanunvericiliklə verilən hüquq, istisna və
        müdafiə vasitələrini məhdudlaşdırmaq məqsədi daşımır.
      </div>
    </div>
  );
}
