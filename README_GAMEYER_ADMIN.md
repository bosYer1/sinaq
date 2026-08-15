# GameYer Admin / Launch qeydləri

## Admin
- Admin route-ları `src/proxy.ts` ilə qorunur.
- Supabase Auth istifadəçisi `admin_users` cədvəlində olmalıdır.
- Klub create/edit relation yazmaları atomik RPC ilə saxlanır.
- Yeni klub üçün koordinat və ən azı bir klub tipi məcburidir.
- Şəkillər `club-images` bucket-ə yüklənir; JPG/PNG/WEBP, maksimum 5 MB.
- Premium tarix admin panelində Bakı vaxtı ilə daxil edilir, DB-də UTC instant kimi saxlanır.

## Public launch
- Next.js 16.3.1 + React 19.2.8.
- `@supabase/ssr` 0.12.4.
- GitHub CI production dependency audit və `next build` keçirir.
- Public klub kartları detail route-a native navigation ilə keçir; bu, stale client-router/RSC keçid problemlərindən qoruyur.
- Xəritə popup-da Google Maps CTA mavi fonda məcburi ağ mətnlə göstərilir.
- Public relation RLS yalnız aktiv klubların məlumatını anon istifadəçiyə göstərir.

Qalan əsas xarici blocker Vercel build-rate-limit-dir. Limit açıldıqdan sonra `main` deploy edilərək `/api/health`, list/map, lokasiya, klub detail və admin login smoke-test olunmalıdır.
