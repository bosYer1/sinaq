# GameYer — Public Launch Checklist

## Kod və build
- [x] Next.js 16.3.1 security upgrade
- [x] React 19.2.8
- [x] `@supabase/ssr` 0.12.4
- [x] React-Leaflet çıxarılıb, stabil Leaflet 1.9 xəritə qatı
- [x] Next async params/searchParams/cookies migration
- [x] Next 16 `middleware` → `proxy` migration
- [x] GitHub Actions production dependency audit
- [x] GitHub Actions production build + TypeScript check
- [x] GitHub Actions lokal production smoke-test
- [x] Smoke-test sitemap-dəki bütün public route-ları yoxlayır
- [x] `/api/health` endpoint — yüngül DB probe, `no-store`, `noindex`, minimal response
- [x] 404, loading və error boundaries
- [x] Klub kartından detail route-a native navigation
- [x] Client runtime error telemetry + same-origin/body-size hardening
- [x] 26 production migration versiyası repo manifesti ilə CI-da yoxlanılır
- [x] Çatışmayan historical migration-lar production history-dən bərpa olunub
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
- [x] Xəritə popup Google Maps CTA — göy fon + məcburi ağ mətn
- [x] Time-dependent statuslar hydration-safe edilib

## Admin və təhlükəsizlik
- [x] Admin proxy + `admin_users` yoxlaması
- [x] Admin login və private route-lar `no-store`
- [x] Bütün public cədvəllərdə RLS aktivdir
- [x] Public anon yalnız aktiv klubları və onların relation-larını oxuyur
- [x] Anon table privilege-ləri SELECT-lə məhdudlaşdırılıb
- [x] Admin write siyasətləri `is_admin()` ilə qorunur
- [x] Storage write yalnız admin; JPG/PNG/WEBP, maksimum 5 MB
- [x] Şəkil URL-ləri yalnız GameYer-in öz Supabase Storage hostundan qəbul edilir
- [x] Duplicate slug və server-side form validation
- [x] Relation save atomik DB transaction-dır
- [x] Edit rollback və create cleanup
- [x] Slug / Instagram / premium DB constraint-ləri
- [x] Premium müddəti Bakı vaxtı ↔ UTC düzgün çevrilir
- [x] `pg_trgm` public schema-dan `extensions` schema-ya köçürülüb
- [x] HSTS, CSP, frame deny, nosniff, referrer və permissions security headers
- [x] Public submission honeypot + format validation + DB rate-limit
- [x] Submission rate-limit eyni contact üzrə transaction lock ilə concurrency-safe edilib
- [x] Supabase security advisor: leaked-password protection xaric əlavə security warning yoxdur
- [ ] Supabase Auth leaked-password protection aktivləşdir — Dashboard/Auth təhlükəsizlik ayarı (connector-da write endpoint yoxdur)

## SEO və public səth
- [x] Canonical metadata
- [x] Sitemap — bütün 30 aktiv klub
- [x] Robots: admin/API disallow
- [x] Admin metadata `noindex/nofollow`
- [x] LocalBusiness structured data
- [x] Open Graph image
- [x] Apple touch icon
- [x] PWA manifest + SVG, 192×192 və 512×512 PNG/maskable iconlar
- [x] iPhone standalone metadata
- [x] Privacy və Əlaqə/məlumat düzəlişi səhifələri
- [x] Klub məlumatının dəyişə biləcəyi barədə istifadəçi disclaimer-i

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
- 2 klubun telefonu
- 4 klubun tam iş qrafiki
- 27 klubun real qiyməti
- 30 klubun real şəkilləri; UI branded/type-aware fallback göstərir

## Production status
- [ ] Vercel build-rate-limit açılsın — hazırda `gameyerr` və `gameyer` check-ləri `build-rate-limit` səbəbilə failure-dır
- [ ] Son `main` commit production-a deploy olunsun
- [ ] Son `main` deploy-dan sonra production `/api/health` = 200 və DB = `ok` yenidən təsdiqlənsin
- [ ] Son `main` deploy-dan sonra sitemap / robots / representative detail route smoke-test yenidən keçirilsin

## Public linki paylaşmazdan əvvəl qalan manual addımlar
1. Supabase Dashboard → Auth təhlükəsizlik ayarından leaked-password protection-u aktivləşdir.
2. Vercel build-rate-limit açıldıqdan sonra son `main` commit-i production-a deploy et və health/sitemap/robots/detail smoke-testlərini yenidən keçir.
3. Real iPhone Safari-də: Siyahı → klub detail → geri; Xəritə → marker → Kluba bax; Google Maps CTA; lokasiya düyməsi axınını bir dəfə yoxla.
4. `gameyer.az` alınarsa Vercel project-ə bağla və `NEXT_PUBLIC_SITE_URL=https://gameyer.az` et; sonra canonical/sitemap/robots hostunu yoxla. Custom domain ilkin public launch üçün məcburi deyil.
