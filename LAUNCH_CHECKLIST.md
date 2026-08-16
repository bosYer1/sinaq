# GameYer — Public Launch Checklist

## Kod və build
- [x] Next.js 16.3.1 + React 19.2.8
- [x] TypeScript / ESLint / production build CI
- [x] Leaflet/OpenStreetMap xəritə qatı
- [x] `/api/health` DB probe
- [x] 404/loading/error boundaries
- [x] Public runtime telemetry
- [x] Production migration manifest CI yoxlaması
- [x] Vercel preview build-ları söndürülüb; `main` production mənbəyidir

## UX
- [x] Mobil və desktop xəritə/list görünüşü
- [x] Mobil xəritə spacing və touch davranışı
- [x] Desktop xəritə ayrıca sərhədli panel
- [x] “Mənim konumum / Yaxın klublar”
- [x] Google Maps marşrut CTA
- [x] Şəkilsiz klub üçün monogram fallback
- [x] Klub detail-də ünvan, telefon, iş saatı, qiymət olduqda qiymət

## Admin və təhlükəsizlik
- [x] Admin auth + `admin_users`
- [x] Public cədvəllərdə RLS
- [x] Admin-only writes
- [x] Secure club image storage qaydaları
- [x] Server-side form validation və duplicate slug qoruması
- [x] Owner claim / məlumat düzəlişi axını
- [x] Privacy-safe page analytics
- [x] Security headers: HSTS, CSP, frame deny, nosniff, referrer, permissions
- [ ] Supabase Auth leaked-password protection — ödənişli/dashboard xüsusiyyəti; hazırkı scope-da qəsdən toxunulmur

## SEO və indekslənmə
- [x] Canonical metadata
- [x] Google verification meta
- [x] `robots.txt`
- [x] Dinamik sitemap
- [x] Filter/search query URL-ləri `noindex, follow`
- [x] LocalBusiness/InternetCafe/EntertainmentBusiness schema
- [x] Breadcrumb schema
- [x] Organization + WebSite schema
- [x] PC / PlayStation / 24 saat landing page-ləri
- [x] Yalnız aktiv klubu olan rayonlara crawlable internal links
- [x] Rayon + tip səhifələri yalnız kifayət qədər real data olduqda sitemap-a düşür
- [x] Xarici map/business rating snapshot-ları public query-də neytrallaşdırılıb; UI və `AggregateRating` schema onları göstərmir
- [ ] Google Search-də faktiki indekslənmə/impression — Search Console və crawl vaxtından asılı xarici mərhələ

## Cari data integrity
- [x] **34 aktiv public klub**
- [x] 34/34 istifadəyə yararlı və unikal marker koordinatı
- [x] Duplicate koordinat qrupu = 0
- [x] Duplicate slug = 0
- [x] Koordinatsız aktiv klub = 0
- [x] Bağlanmış/zəif əsaslandırılmış qeydlər public dataset-dən çıxarılıb
- [x] IGROTEKA real klubdur, lakin səhv Marvel markerini paylaşdığı üçün dəqiq 4B koordinatı tapılanadək deaktivdir
- [x] 30 klubda telefon mövcuddur; 4 klubda etibarlı telefon tapılmadığı üçün boşdur
- [x] 30 klubda iş saatı mövcuddur; 4 klubda etibarlı qrafik tapılmadığı üçün boşdur
- [x] 7 klubda Instagram mövcuddur; qalanlarında təsdiqsiz hesab yazılmır
- [x] 4 klubda təsdiqlənmiş pricing mövcuddur; qalanlarında qiymət uydurulmur
- [ ] Klub sahibi/rəsmi nümayəndə təsdiqi: 0/34 — outreach tələb edir
- [ ] Real/icazəli klub şəkilləri: 0/34 — klub/rəsmi mənbədən material tələb edir

## Açıq data konfliktləri — avtomatik dəyişdirilməməlidir
- [ ] Kenza Gaming Lounge — cari Yandex Puşkin 54B və DB koordinatı üst-üstə düşür; Fikrət Əmirov 24 alternativ kataloq izi relocation/filial tarixi kimi ayrıca qeyd olunur
- [ ] Milli Gaming Arena — Təbriz 95/97 vs Ağa Nemətulla 120 mənbə konflikti
- [ ] Avallon Gaming — ünvan variantları; cari DB bir neçə mənbə ilə əsaslandırılır

## Custom domain — `gameyer.az`
- [x] Kod `NEXT_PUBLIC_SITE_URL` ilə custom domain-ə hazırdır
- [ ] Domeni əldə et
- [ ] Vercel project-ə domain əlavə et
- [ ] DNS yönləndir
- [ ] `NEXT_PUBLIC_SITE_URL=https://gameyer.az`
- [ ] Canonical/robots/sitemap/Search Console-u yeni domainlə yenidən yoxla

## Social launch
- [x] Footer və Organization schema Instagram/TikTok linklərinə hazırdır
- [x] UTM və launch planı `SOCIAL_LAUNCH.md`-dədir
- [ ] Instagram/TikTok hesablarında bio/post paylaşımı

## Source-of-truth
Cari klub sayı və məlumat həqiqəti üçün `docs/CLUB_TRUTH_AUDIT_2026-08-15.md` və canlı Supabase əsas götürülür. `docs/CLUB_SOURCE_MANIFEST_2026-08-15.md` tarixi arxivdir və 60 klub hədəfini bərpa etmək üçün istifadə edilməməlidir.

## Release gate
Bu checklistdəki kod dəyişiklikləri yalnız ayrıca branch-də CI tam yaşıl olduqdan sonra `main`-ə merge edilməlidir. Production deploy yalnız istifadəçinin ayrıca `deploy et` əmri ilə edilməlidir.
