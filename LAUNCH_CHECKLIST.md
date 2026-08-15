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
- [x] `/api/health` endpoint
- [x] 404, loading və error boundaries
- [x] Klub kartından detail route-a native navigation

## Mobil UX
- [x] `100dvh` əsas layout
- [x] Mobil xəritə çərçivəsi və spacing
- [x] “Mənim konumum / Yaxın klublar” xəritə düyməsi
- [x] İstifadəçi marker-i və məsafə hesablaması
- [x] Mobil Leaflet zoom control-ları gizlədilib; pinch zoom saxlanılıb
- [x] Mobil filter touch target-ları böyüdülüb
- [x] Siyahı/Xəritə toggle həmişə görünür
- [x] Xəritə popup Google Maps CTA — göy fon + məcburi ağ mətn

## Admin və təhlükəsizlik
- [x] Admin proxy + `admin_users` yoxlaması
- [x] Bütün public cədvəllərdə RLS aktivdir
- [x] Public anon yalnız aktiv klubları və onların relation-larını oxuyur
- [x] Anon table privilege-ləri SELECT-lə məhdudlaşdırılıb
- [x] Admin write siyasətləri `is_admin()` ilə qorunur
- [x] Storage write yalnız admin; JPG/PNG/WEBP, maksimum 5 MB
- [x] Duplicate slug və server-side form validation
- [x] Relation save atomik DB transaction-dır
- [x] Edit rollback və create cleanup
- [x] Slug / Instagram / premium DB constraint-ləri
- [x] Premium müddəti Bakı vaxtı ↔ UTC düzgün çevrilir
- [x] `pg_trgm` public schema-dan `extensions` schema-ya köçürülüb
- [ ] Supabase Auth leaked-password protection aktivləşdir — Dashboard/Auth təhlükəsizlik ayarı (connector-da write endpoint yoxdur)

## SEO və public səth
- [x] Canonical metadata
- [x] Sitemap
- [x] Robots: admin/API disallow
- [x] Admin metadata `noindex/nofollow`
- [x] LocalBusiness structured data
- [x] Open Graph image
- [x] Apple touch icon + manifest
- [x] iPhone standalone metadata
- [x] Privacy və Əlaqə/məlumat düzəlişi səhifələri

## Data
- [x] 30 aktiv klub
- [x] 30/30 koordinat
- [x] 30/30 rayon
- [x] 30/30 ünvan
- [x] 30/30 klub tipi
- [ ] 2 klubun telefonu təsdiqlənməyib — boş saxlanılır
- [ ] 4 klubun tam iş qrafiki təsdiqlənməyib — boş saxlanılır
- [ ] Real klub şəkilləri — launch blocker deyil, branded fallback var
- [ ] Əlavə real qiymətlər — launch blocker deyil, “Qiymət məlum deyil” fallback var

## Public-a çıxış üçün qalan xarici addımlar
1. Vercel build-rate-limit açıldıqdan sonra ən son `main` commit-i production-a deploy et.
2. Canlı deployment-da `/api/health` = 200 yoxla.
3. Ana səhifə, filterlər, map/list, lokasiya, klub detail və admin login üzrə smoke test et.
4. `gameyer.az` alınarsa Vercel project-ə bağla.
5. `NEXT_PUBLIC_SITE_URL=https://gameyer.az` olaraq Production/Preview env-lərdə dəyiş.
6. Redeploy et; canonical, sitemap və robots domenini yoxla.
7. Son mobil Safari + desktop smoke test-dən sonra public linki paylaş.
