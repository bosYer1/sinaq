# GameYer analytics metric glossary

Bu sənəd Founder Analytics və əl ilə aparılan trafik yoxlamalarında eyni anlayışların eyni mənada işlədilməsi üçündür.

## Scope

Founder Analytics davranış göstəriciləri yalnız aşağıdakı PostHog event-lərini əsas sayır:

- `gameyer_traffic_scope = public`
- `$host = gameyer.az`
- məlum bot kimi işarələnməyən event-lər

Localhost, Cloudflare standby hostları və test scope production KPI-larına qarışdırılmamalıdır.

## User / visitor

### PostHog visitor

`person_id` ilə deduplikasiya olunan anonim brauzer identikliyidir. Bu rəqəm təsdiqlənmiş fiziki insan sayı deyil. Cookie/storage silinməsi və başqa cihaz/brauzer yeni identity yarada bilər.

### Supabase persistent visitor

Legacy `page_views.session_id` GameYer-in persistent anonymous browser visitor ID-sidir. Adı `session_id` olsa da sessiya mənasında istifadə edilmir.

PostHog və Supabase fərqli tarixdən data topladığı və fərqli identity mexanizmləri istifadə etdiyi üçün onların all-time user rəqəmləri bir-birinə toplanmır və eyni KPI kimi müqayisə edilmir.

## Session / visit

### PostHog session

PostHog `$session_id` ilə deduplikasiya edilir.

### Supabase visit

`page_views.visit_id` ayrıca browser visit identifikatorudur. Supabase-da `session_id` persistent visitor, `visit_id` isə visit-dir.

## Returning user

Founder Analytics-də `returning user` seçilmiş intervalda aktiv olan və həmin interval başlamazdan əvvəl də production public `$pageview` event-i olmuş PostHog visitor-dur.

Bu metrik `2+ session` ilə eyni deyil. Eyni gün ikinci session yaratmaq period-returning user demək deyil.

All-time `different-day return` ayrıca ölçüdür: visitor ən azı iki fərqli Bakı təqvim günündə aktiv olub. Bu göstərici Founder Analytics period-returning rate ilə qarışdırılmamalıdır.

## D1 / D3 / D7 retention

Retention ilk production public pageview gününə əsaslanan cohort-dur. Gün sərhədləri `Asia/Baku` timezone-u ilə hesablanır.

- D1: ilk gündən 1 təqvim günü sonra yenidən aktivlik
- D3: ilk gündən 3 təqvim günü sonra yenidən aktivlik
- D7: ilk gündən 7 təqvim günü sonra yenidən aktivlik

Hər retention nöqtəsinin ayrıca mature denominator-u var. Məsələn D1 üçün sabahı tam müşahidə olunmayan cohort denominator-a daxil edilmir; D7 üçün isə yeddi günlük müşahidə pəncərəsi tamamlanmalıdır.

## CTA

`phone_click`, `instagram_click`, `maps_click` intent event-ləridir.

- `phone_click` real telefon danışığının sübutu deyil.
- Bir visitor eyni CTA-ya bir neçə dəfə klikləyə bilər.
- CTA event sayı user/conversion sayı kimi təqdim edilmir.

## PWA

- `pwa_install_available`: browser install prompt verə bilərdi. Bu install deyil.
- `pwa_installed`: `appinstalled` event-i ilə təsdiqlənmiş install.
- `pwa_standalone_opened`: sayt standalone/app display mode-da açılıb; xüsusən iOS üçün əlavə installed-app siqnalıdır.

Təsdiqlənmiş install sayı yalnız `pwa_installed` kimi təqdim olunur. iOS-da `appinstalled` etibarlı olmadığı üçün `pwa_standalone_opened` ayrıca göstərilir və install totalına kor-koranə əlavə edilmir.

## Calendar time

Günə görə trend və retention üçün canonical timezone `Asia/Baku`-dur. UTC gün sərhədləri bu KPI-lar üçün istifadə edilməməlidir.
