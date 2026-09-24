# GameYer Android release checklist

## Təsdiqlənmiş release config

- App adı: `GameYer`
- Package: `az.gameyer.app`
- Version: `1.0.0`
- Version code: `1` — hər yeni Play build-də artırılmalıdır
- Deep-link scheme: `gameyer`
- Orientation: portrait
- Icon/adaptive icon/splash: mövcud original GameYer assetləri
- Location: yalnız istifadəçi hərəkətindən sonra foreground coarse/fine; background location və foreground location service bloklanıb
- Mobile data access: public Supabase SELECT-only; account/admin/direct DB write yoxdur
- Production build: AAB (`eas.json` production profile)

## Store listing draft

App name: GameYer

Short description:

> Azərbaycandakı PC və PlayStation klublarını kəşf edin.

Full description draft:

> GameYer Azərbaycandakı PC və PlayStation gaming klublarını tapmağı asanlaşdırır. Klub siyahısında real ünvan, rayon, mövcud tariflər, iş saatları və əlaqə məlumatlarına baxın. Axtarış və filtrlərlə uyğun klubu seçin, istəsəniz yalnız cihazda işlənən foreground mövqeyiniz əsasında koordinatı olan klubları məsafəyə görə sıralayın. Telefon, rəsmi Instagram səhifəsi və istiqamət action-ları cihazın uyğun tətbiqində açılır. Məlumat çatışmırsa GameYer uydurma qiymət və ya iş saatı göstərmir.

Privacy policy URL: `https://gameyer.az/mexfilik`

TODO — founder təsdiqi:

- Support/contact email
- Developer/company display name və hüquqi ünvan tələbi
- App category, target audience və content rating cavabları
- Yekun localized listing copy

## Data Safety draft — Play Console-da founder tərəfindən təsdiqlənməlidir

- App hesab, ad, email, telefon kitabçası, ödəniş və reklam identifikatoru toplamır.
- İstifadəçinin foreground location-u yalnız “Yaxınlıq” action-ından sonra alınır, RAM-da məsafə hesablanmasına sərf olunur, Supabase/analytics və başqa serverə göndərilmir, ekran tərk ediləndə silinir.
- Google Play-in qaydasına görə yalnız cihazda emal edilən və cihazdan çıxmayan location “collected” sayılmaya bilər; yekun cavab dependency/SDK davranışı və release binary-si ilə yenidən yoxlanmalıdır.
- Public klub datası Supabase-dən HTTPS ilə oxunur. Heç bir mobile mutation, service role və admin credential yoxdur.
- Data Safety formu closed/open/production track üçün doldurulmalı və privacy policy ilə uyğun olmalıdır.

## Graphics

- Play icon: 512×512, 32-bit PNG, maksimum 1 MB — mövcud original assetdən export və vizual yoxlama tələb olunur.
- Feature graphic: 1024×500 JPEG və ya 24-bit PNG, alpha yoxdur — TODO, original brand assetlə hazırlanmalıdır; fake logo istifadə etməyin.
- Phone screenshots: minimum 2; 320–3840 px, uzun tərəf qısa tərəfin 2 qatından çox deyil. Tövsiyə: ən azı 4 ədəd 1080×1920 portrait real-device screenshot.
- Screenshot seti: Discovery, filter/search, detail, Nearby permission/distance, More/theme. Xəritə yalnız blocker bağlandıqdan sonra daxil edilməlidir.
- Tələblər: [Google Play preview assets](https://support.google.com/googleplay/android-developer/answer/9866151)

## Build və closed testing

- [ ] Founder Google Maps billing istifadəsinə və restricted API key yaradılmasına ayrıca icazə verir.
- [ ] Android Studio/SDK + JDK local build üçün qurulur və ya Expo hesabında EAS build seçilir.
- [ ] Development build-də `DEVICE_QA.md` map gate və bütün Android flow-ları real cihazda tamamlanır.
- [ ] Production Supabase public env və restricted Maps key build environment-də verilir; heç biri git-ə commit edilmir.
- [ ] `versionCode` artırılır və signed production AAB yaradılır.
- [ ] Play App Signing/upload key idarəsi qurulur; credential repo-ya salınmır.
- [ ] Internal test, sonra closed test aparılır; crash/ANR/pre-launch report yoxlanır.
- [ ] Əgər personal developer hesabı 13 noyabr 2023-dən sonra açılıbsa, minimum 12 tester 14 gün fasiləsiz opt-in saxlamalıdır.
- [ ] Data Safety, content rating, target audience, ads declaration, app access və privacy policy tamamlanır.
- [ ] Release notes və staged rollout planı hazırlanır; əvvəlcə kiçik faiz, sonra metriklər yoxlanaraq artırılır.
- [ ] Public production rollout yalnız founder-in ayrıca təsdiqindən sonra edilir.

Cari target API tələbi submission tarixində yenidən yoxlanmalıdır: 31 avqust 2026-dan yeni app/update üçün Android 16 / API 36 tələb olunur. Expo SDK 57 generated native target-i real AAB manifestindən təsdiqləyin.
