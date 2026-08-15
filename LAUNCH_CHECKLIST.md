# GameYer — Public Launch Checklist

## Kod və build
- [x] Next.js 16.3.1 security upgrade
- [x] React 19.2.8
- [x] `@supabase/ssr` 0.12.4
- [x] Stabil Leaflet 1.9 xəritə qatı
- [x] Next async params/searchParams/cookies migration
- [x] Next 16 `middleware` → `proxy` migration
- [x] GitHub Actions production dependency audit
- [x] GitHub Actions production build + TypeScript check
- [x] GitHub Actions lokal production smoke-test
- [x] Smoke-test sitemap-dəki bütün public route-ları yoxlayır
- [x] `/api/health` endpoint — yüngül DB probe, `no-store`, `noindex`, minimal response
- [x] 404, loading və error boundaries
- [x] Klub kartından detail route-a Next client navigation
- [x] Client runtime error telemetry + same-origin/body-size hardening
- [x] Production migration manifest CI-da yoxlanılır
- [x] Empty-project disaster recovery üçün core schema bootstrap sənədləşdirilib
- [x] Vercel preview build-ları söndürülüb; yalnız `main` production deploy yaradır

## Mobil UX
- [x] `100dvh` əsas layout
- [x] Mobil xəritə çərçivəsi və spacing
- [x] “Mənim konumum / Yaxın klublar” xəritə düyməsi
- [x] İstifadəçi marker-i və məsafə hesablaması
- [x] Mobil Leaflet zoom control-ları gizlədilib; pinch zoom saxlanılıb
- [x] Mobil filter touch target-ları böyüdülüb
- [x] Siyahı/Xəritə toggle həmişə görünür
- [x] Mobil siyahı rejimində Leaflet mount olunmur
- [x] Xəritə ayrıca error boundary ilə izolasiya olunub
- [x] Xəritə popup Google Maps CTA
- [x] Time-dependent statuslar hydration-safe edilib
- [x] Şəkilsiz klub detail hero-su mobil ekranda kəsilmir
- [x] PC/PlayStation label-i mobil hero-da normal badge kimi göstərilir

## Admin və təhlükəsizlik
- [x] Admin proxy + `admin_users` yoxlaması
- [x] Admin login və private route-lar `no-store`
- [x] Bütün public cədvəllərdə RLS aktivdir
- [x] Public anon yalnız aktiv klubları və onların relation-larını oxuyur
- [x] Anon table privilege-ləri minimuma endirilib
- [x] Admin write siyasətləri `is_admin()` ilə qorunur
- [x] Storage write yalnız admin; JPG/PNG/WEBP, maksimum 5 MB
- [x] Admin şəkilləri birbaşa Supabase Storage-a yükləyir
- [x] Şəkil URL-ləri yalnız GameYer-in öz Supabase Storage hostundan qəbul edilir
- [x] Duplicate slug və server-side form validation
- [x] Relation save atomik DB transaction-dır
- [x] Edit rollback və create cleanup
- [x] Slug / Instagram / premium DB constraint-ləri
- [x] Premium müddəti Bakı vaxtı ↔ UTC düzgün çevrilir
- [x] HSTS, CSP, frame deny, nosniff, referrer və permissions security headers
- [x] Public submission honeypot + format validation + DB rate-limit
- [x] Owner claim qiymət, iş saatı və rəsmi Instagram məlumatını strukturlaşdırılmış toplayır
- [x] Admin owner claim məlumatını ayrıca sahələr kimi görür
- [x] Privacy-safe page analytics
- [x] Analytics trafik mənbələri: Direct / Google / Instagram / Facebook / TikTok və digər hostname-lər
- [x] Analytics RPC `SECURITY INVOKER`; raw page-view SELECT yalnız admin RLS-dən keçir
- [x] Supabase security advisor tətbiq səviyyəsində harden edilib
- [ ] Supabase Auth leaked-password protection-u aktivləşdir — yalnız Dashboard/Auth ayarı, launch blocker deyil

## SEO və indekslənmə
- [x] Əsas `gameyerr-gameyer.vercel.app` production response `x-robots-tag: noindex` qaytarmır
- [x] Canonical metadata production GameYer URL-inə baxır
- [x] Google verification meta aktivdir
- [x] Sitemap — bütün aktiv klublar + SEO landing page-lər
- [x] Robots — `/admin` və `/api` crawl bloklanır
- [x] Filter/search query URL-ləri `noindex, follow`
- [x] LocalBusiness / InternetCafe / EntertainmentBusiness structured data
- [x] Breadcrumb structured data
- [x] Open Graph/social preview
- [x] Google large image/snippet preview direktivləri
- [x] Bakıda PC/kompüter/internet klub landing page-i
- [x] Bakıda PlayStation/PS klub landing page-i
- [x] Bakıda 24 saat gaming klub landing page-i
- [x] Rayon landing page-ləri
- [x] Rayon + klub tipi landing page-ləri kifayət qədər real data olduqda sitemap-a düşür
- [x] Legacy `/tip/pc` və `/tip/playstation` server-side permanent redirect
- [x] Klub detail səhifələrindən rayon/tip internal linking
- [x] Apple touch icon + PWA manifest
- [x] Privacy və Əlaqə/məlumat düzəlişi səhifələri
- [x] Klub məlumatının dəyişə biləcəyi barədə disclaimer
- [x] Search Console ownership HTML meta ilə təsdiqlənib

## Klub vizualları
- [x] Etibarsız Instagram/Facebook avatar proxy və generic favicon “logo”ları çıxarılıb
- [x] Təsdiqlənməmiş klub üçün saxta logo istifadə olunmur
- [x] Rəsmi logo olmayan klub üçün klub adına əsaslanan fərdi monogram fallback
- [x] Logo yüklənməzsə avtomatik monogram fallback
- [x] LaLiga-nın təsdiqlənmiş filiallarında eyni stabil brand asset-i istifadə olunur
- [x] Real interyer/klub şəkilləri loqodan ayrıca saxlanılır

## Data integrity — 60 klub release
- [x] Hazır production bazada 30 aktiv klub
- [x] Əlavə 30 real klub üçün idempotent migration hazırdır: `20260815_add_30_verified_baku_clubs.sql`
- [x] Mənbə manifesti hazırdır: `docs/CLUB_SOURCE_MANIFEST_2026-08-15.md`
- [x] Mənbədə olmayan telefon/iş saatı/koordinat uydurulmur
- [x] Yeni 30 klub üçün unikal slug və ən azı bir klub tipi hazırlanıb
- [ ] Final release-dən dərhal əvvəl migration production DB-yə tətbiq edilsin
- [ ] Tətbiqdən sonra aktiv klub sayı `>= 60`, duplicate slug = 0, orphan relation = 0 yoxlanılsın

## Custom domain — `gameyer.az`
- [x] Kod custom domainə hazırdır: `NEXT_PUBLIC_SITE_URL` canonical, sitemap, robots, JSON-LD və sosial URL-lərin baza ünvanını idarə edir
- [x] `gameyer.az` internet axtarışında aktiv/indexlənən sayt kimi görünmür
- [ ] Domenin registrar mülkiyyəti — xarici ödəniş tələb edir; tətbiq kodu bunu özü edə bilməz
- [ ] Domen alındıqda Vercel-ə `gameyer.az` / `www.gameyer.az` əlavə ediləcək və `NEXT_PUBLIC_SITE_URL=https://gameyer.az` ediləcək

> Domain alınana qədər production canonical `https://gameyerr-gameyer.vercel.app` qalmalıdır. Mövcud olmayan domenə canonical vermək SEO səhvidir.

## Search Console
- [x] Google verification token metadata-da mövcuddur
- [x] Ownership təsdiqi daha əvvəl uğurlu tamamlanıb
- [x] `robots.txt` sitemap ünvanını canonical production host ilə generasiya edir
- [x] Sitemap klub/rayon/tip/SEO landing route-larını əhatə edir
- [ ] Custom domain alınarsa ayrıca `gameyer.az` property/canonical yoxlanışı ediləcək

## Social launch
- [x] Footer və Organization JSON-LD GameYer Instagram/TikTok handle-lərinə hazırdır
- [x] Admin analytics Instagram/TikTok referrer-lərini ayrıca qruplaşdırır
- [x] Social preview üçün 1200×630 Open Graph image route var
- [x] Instagram/TikTok launch mətnləri və UTM planı `SOCIAL_LAUNCH.md`-də hazırdır
- [ ] Sosial hesabların öz platformalarında bio/post paylaşılması xarici hesab write əməliyyatıdır; repo/deploy blocker deyil

## Final release gate
- [ ] `final-launch-8-stage` üçün GitHub CI tam yaşıl
- [ ] +30 klub migration production DB-yə tətbiq olunsun və data integrity yoxlanılsın
- [ ] Branch `main`-ə merge olunsun
- [ ] **Yalnız bir** production deployment başlasın
- [ ] Deployment `READY` olsun
- [ ] `/api/health` = 200 və DB = `ok`
- [ ] `/robots.txt` və `/sitemap.xml` = 200
- [ ] Sitemap 60+ klub datasını əhatə etsin
- [ ] Homepage və representative detail canonical eyni final domainə baxsın
- [ ] Production-da `x-robots-tag: noindex` olmasın
- [ ] OpenGraph/Twitter image final production domainindən gəlsin
- [ ] Logo fallback və mobil şəkilsiz hero smoke-test
- [ ] `/admin/statistika` authentication ilə qorunsun və source analytics UI mövcud olsun

## Launch blocker sayılmayan qəsdən boş məlumatlar
- Mənbədə telefon görünməyən klublar
- Mənbədə tam iş qrafiki görünməyən klublar
- Təsdiqlənməyən qiymətlər
- Klub sahiblərindən/rəsmi mənbədən hələ alınmayan interyer şəkilləri
- Ödəniş tələb edən `gameyer.az` registrar əməliyyatı
- Instagram/TikTok hesabı daxilində faktiki post/bio write əməliyyatı
