# GameYer SEO 2.0 və orqanik böyümə planı — 2026-08-15

## Məqsəd
GameYer-i “elan saytı” kimi deyil, Azərbaycanda gaming klub discovery/directory platforması kimi möhkəmləndirmək. Orqanik artımın bazası real klub datası, local search intent, crawlable daxili linklər və etibarlı first-party məlumat olmalıdır.

## 1. Texniki discovery graph
- Ana səhifə → Bakı PC / PlayStation / 24 saat / rayon səhifələri.
- PC və PlayStation landing səhifələri → yalnız ən azı 2 real nəticəsi olan rayon+tip səhifələri.
- Rayon səhifələri → klub detail + data kifayət etdikdə rayon+tip səhifələri.
- Klub detail → rayon və global klub tipi landing səhifələri.
- Sitemap yalnız indexlənməsini istədiyimiz canonical public URL-ləri saxlayır.
- Filter/search query URL-ləri noindex, follow qalır.

## 2. Entity və structured data
- Site-wide Organization + WebSite entity.
- Klub detail səhifələrində ən uyğun LocalBusiness subtype: InternetCafe / EntertainmentBusiness.
- Klub structured data yalnız DB-də real olan sahələri çıxarır: telefon, ünvan, geo, iş saatı, qiymət, Instagram, reytinq.
- Breadcrumb və ItemList strukturlaşdırılmış məlumatı landing/rayon səhifələrində saxlanılır.
- Saxta review, saxta qiymət, saxta iş saatı və saxta sosial hesab əlavə edilmir.

## 3. Search-intent klasterləri
### Artıq mövcud və prioritet
- Bakıda PC klubları
- Bakıda kompüter klubları
- Bakıda internet klubları / internet-kafe
- Bakıda PlayStation klubları / PS klubları
- Bakıda 24 saat gaming klubları
- `{rayon} PC klubları`
- `{rayon} PlayStation klubları`
- konkret klub adı + ünvan / iş saatı / telefon / qiymət

### Yalnız data kifayət etdikdə yaradılacaq
- “ucuz PC klubları” — yalnız kifayət qədər aktual qiymət datası olduqda
- “ən yaxşı gaming klubları” — yalnız real rating/review sistemi kifayət etdikdə
- avadanlıq intent-ləri (RTX, monitor Hz və s.) — yalnız klubdan təsdiqlənmiş hardware datası olduqda
- metro/yaxınlıq intent-ləri — yalnız koordinat + metro proximity hesablaması düzgün qurulduqda

## 4. People-first / first-party üstünlük
GameYer-in Google-da fərqlənməsi üçün başqa kataloqlardan sadəcə məlumat köçürmək kifayət deyil. Unikal dəyər kimi aşağıdakılar toplanmalıdır:
- klub sahibinin təsdiqi və təsdiq tarixi;
- GameYer tərəfindən son yoxlanma tarixi;
- aktual qiymət menyusu;
- real interyer şəkilləri və istifadə icazəsi;
- PC/PS avadanlıq detalları;
- oturacaq/zone məlumatı;
- 24/7 statusu;
- yaxın metro və təxmini məsafə;
- istifadəçilərin real, moderasiya olunan rəyləri (gələcək mərhələ).

## 5. Klub səhifəsi tamlıq hədəfi
Hər klub üçün ideal public profil:
1. dəqiq ad;
2. dəqiq ünvan və koordinat;
3. rayon;
4. PC / PlayStation tipi;
5. telefon;
6. rəsmi Instagram/site;
7. həftəlik iş saatı;
8. aktual qiymət;
9. real şəkillər;
10. qısa, faktiki təsvir;
11. son yenilənmə tarixi;
12. sahib təsdiqi varsa verification.

Tapılmayan məlumat boş qalır. SEO score artırmaq üçün məlumat uydurulmur.

## 6. Off-page trafik və authority
- Hər klub sahibinə öz GameYer profil linkini göndərmək və rəsmi sosial bio/story/site-də həmin URL-ə link istəmək.
- Azərbaycan gaming/esports icmaları və universitet gaming icmaları ilə real əməkdaşlıq.
- Gaming turnirləri və tədbirlər üçün məlumat səhifələri yalnız real tədbir olduqda.
- Instagram/TikTok qısa videoları konkret GameYer landing/detail URL-lərinə yönəltmək.
- UTM ilə Instagram/TikTok kampaniyalarını daxili analytics-də ölçmək.
- Spam backlink, pullu link şəbəkəsi və kütləvi kataloq spamından uzaq durmaq.

## 7. Kontent sistemi
Random blog yox. GameYer-in öz datasından yaranan istifadəçi faydalı səhifələr:
- rayon üzrə klub bələdçiləri;
- 24/7 klub siyahısı;
- qiymət coverage kifayət etdikdə qiymət müqayisəsi;
- yeni təsdiqlənmiş / məlumatı yenilənmiş klublar;
- real tədbir/turnir varsa tədbir bələdçisi;
- klub seçmək üçün faktiki kriteriyalar.

Kütləvi AI-generated, bir-birini təkrarlayan “SEO məqalələri” yaradılmır.

## 8. Ölçüləcək KPI-lar
### Search Console
- indexed pages;
- impressions;
- clicks;
- CTR;
- average position;
- query və page üzrə performans;
- branded query: GameYer / Game Yer;
- non-branded query: PC klub Bakı, PlayStation klub Bakı və rayon intent-ləri.

### GameYer analytics
- Google-dan gələn session;
- landing page üzrə trafik;
- klub detail view;
- Google Maps CTA klikləri (gələcək event analytics);
- telefon/Instagram CTA klikləri (gələcək event analytics);
- Instagram/TikTok referrer trafik.

## 9. Domain planı
`gameyer.az` əldə edilənədək mövcud production host canonical olaraq qalmalıdır. Domen aktivləşəndə:
1. Vercel-ə gameyer.az + www əlavə et;
2. DNS-i yönəlt;
3. `NEXT_PUBLIC_SITE_URL=https://gameyer.az` et;
4. köhnə hostdan yeni domainə permanent redirect planını yoxla;
5. canonical, sitemap, robots, OG və JSON-LD hostunu smoke-test et;
6. Search Console-da yeni domain property-ni təsdiqlə və sitemap göndər.

## 10. Release gate
SEO 2.0 production-a çıxmazdan əvvəl:
- lint/build/CI yaşıl;
- bütün sitemap HTML URL-ləri 2xx;
- sitemap səhifələri self-canonical və indexable;
- homepage filter query-ləri noindex/follow;
- public canonical host düzgündür;
- structured data yalnız visible/real məlumatı əks etdirir;
- production deploy yalnız ayrıca “deploy et” əmri ilə edilir.
