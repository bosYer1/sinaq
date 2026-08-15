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
- [x] Admin şəkilləri birbaşa Supabase Storage-a yükləyir; Vercel body limiti bypass olunur
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
- [x] Supabase security advisor: yalnız leaked-password protection warning-i qalır
- [ ] Supabase Auth leaked-password protection-u aktivləşdir — Dashboard/Auth təhlükəsizlik ayarı

## SEO və public səth
- [x] Canonical metadata
- [x] Sitemap — bütün aktiv klublar + SEO landing page-lər
- [x] Robots — API crawl bloklanır; admin səhifələri öz `noindex/nofollow` metadata-sı ilə qorunur
- [x] Filter/search query URL-ləri `noindex, follow`
- [x] LocalBusiness / InternetCafe / EntertainmentBusiness structured data
- [x] Breadcrumb structured data
- [x] Open Graph/social preview
- [x] Google large image/snippet preview direktivləri
- [x] Bakıda PC/kompüter/internet klub landing page-i
- [x] Bakıda PlayStation/PS klub landing page-i
- [x] Rayon + klub tipi landing page-ləri yalnız kifayət qədər real data olduqda indexlənir
- [x] Legacy `/tip/pc` və `/tip/playstation` server-side permanent redirect
- [x] Apple touch icon
- [x] PWA manifest + PNG/maskable iconlar
- [x] iPhone standalone metadata
- [x] Privacy və Əlaqə/məlumat düzəlişi səhifələri
- [x] Klub məlumatının dəyişə biləcəyi barədə disclaimer

## Klub vizualları
- [x] Rəsmi mənbə ilə təsdiqlənən klub/filiallarda real brand logo registry-si
- [x] Təsdiqlənməmiş klub üçün saxta logo istifadə olunmur
- [x] Rəsmi logo olmayan klub üçün klub adına əsaslanan fərdi monogram fallback
- [x] Logo yüklənməzsə avtomatik monogram fallback
- [x] Real interyer/klub şəkilləri loqodan ayrıca saxlanılır

## Data integrity
- [x] 30 aktiv klub
- [x] 30/30 koordinat
- [x] 30/30 rayon
- [x] 30/30 ünvan
- [x] 30/30 klub tipi
- [x] Duplicate slug = 0
- [x] Duplicate iş günü = 0
- [x] Orphan relation = 0
- [x] Qrafiki olan bütün klublarda 7 tam gün

## Təsdiqlənmədiyi üçün qəsdən boş saxlanılan məlumatlar — launch blocker deyil
- Bəzi klublarda telefon
- Bəzi klublarda tam iş qrafiki
- Bir çox klubda real qiymət
- Real interyer şəkilləri klub sahibləri/rəsmi mənbələrdən gəldikcə əlavə ediləcək

## Production status
- [ ] Vercel build-rate-limit açılsın
- [ ] Son `main` commit production-a bir dəfə deploy olunsun
- [ ] Production `/api/health` = 200 və DB = `ok`
- [ ] Production sitemap / robots / canonical / representative detail route smoke-test
- [ ] Admin `/admin/statistika` real browser girişindən sonra page-view və traffic-source data göstərsin

## Public launchdan əvvəl manual addımlar
1. Supabase Dashboard → Auth təhlükəsizlik ayarından leaked-password protection-u aktivləşdir.
2. Vercel build-rate-limit açıldıqdan sonra final `main` production-a yalnız bir dəfə deploy et.
3. Real iPhone Safari-də: Siyahı → klub detail → geri; Xəritə → marker → Kluba bax; Google Maps CTA; lokasiya düyməsini yoxla.
4. `gameyer.az` alınarsa Vercel project-ə bağla və `NEXT_PUBLIC_SITE_URL=https://gameyer.az` et. Custom domain ilkin launch üçün məcburi deyil.
