# GameYer device QA checklist

Bu checklist real Android və iOS cihazında release candidate yoxlaması üçündür. Aşağıdakı maddələr desktop bundle export ilə təsdiqlənmiş sayılmır.

## Map-dan müstəqil beta sprint — 2026-08-29

**KNOWN BLOCKER — Android physical device map rendering unresolved.** Expo SDK 53-dən etibarən Google Maps Expo Go Android-dan çıxarılıb; SDK 57 xəritəsi restricted Google Maps key ilə development build-də yoxlanmalıdır. Billing/key founder icazəsi tələb etdiyi üçün bu checklistdə xəritə PASS deyil.

Founder əvvəlki build-də Android launch, public data, Discovery/list, theme və bottom tabs üçün PASS bildirib. Aşağıdakı yeni build ssenariləri **PENDING real-device QA**:

- [ ] Təmiz launch: heç bir location prompt yoxdur; Kəşf et, Xəritə, Yaxınlıq, Daha çox tabları görünür.
- [ ] Kəşf et: uzun scroll, Azerbaijani search, PC/PlayStation/rayon/verified, görünən reset və no-results reset.
- [ ] Detail: original profile şəkli birincidir, qalan gallery swipe işləyir; qiymət/tariff/saatlar realdır; unknown data uydurulmur; expired Premium görünmür.
- [ ] Telefon/Instagram/İstiqamət al cihaz tətbiqini açır; geri qayıtmaq mümkündür; dəstəklənməyən link alert göstərir.
- [ ] Yaxınlığa girmək prompt göstərmir. Yalnız “Mövqeyimi istifadə et” soruşur. Deny və “bir daha soruşma” hallarında izahlı UI, settings/retry və Kəşf et işləyir.
- [ ] Android approximate və precise permission: məsafələr artan sıra ilə, km formatında görünür; koordinatsız klub yoxdur. Bu, düz xətt məsafəsidir, yol məsafəsi deyil.
- [ ] GPS sönülü, indoor timeout, permission sorğusu zamanı geri/tab dəyişmə: stuck spinner və crash yoxdur. Yenidən cəhd işləyir.
- [ ] Yaxınlıqdan çıxmaq/background-a keçmək mövqeyi təmizləyir; geri gələndə istifadəçi yenidən düyməyə basır. Background izləmə yoxdur.
- [ ] Daha çox → Görünüş → Light/Dark/System → geri: tema saxlanır; Görünüş top-level tab deyil. Əlaqə/Haqqımızda/Məxfilik keçidləri işləyir. Klub sahibi səhifəsi yalnız məlumatdır.
- [ ] Offline startup/refresh: generic error/retry; uğurlu list refresh-dən əvvəlki nəticələr itmir; şəbəkə bərpa olunduqda recovery.
- [ ] Kiçik ekran, maksimum font, TalkBack: kart mətnləri, action və filter düymələri istifadə edilə bilir; Android hardware back düzgün işləyir.

İstifadəçi koordinatlarını screenshot/log hesabatına daxil etməyin. Custom native build-lərdə yeni foreground permission config üçün rebuild lazımdır; Expo Go daxilində paket hazırdır. Heç bir paid service/signing/production write aktivləşdirilməyib.

## Android native map təkrar QA — 2026-08-29

Founder-in əvvəlki cihaz nəticəsi: Expo Go launch, GameYer bundle, public klub datası və Kəşf et/list PASS; Xəritə tabı FAIL. Aşağıdakı yeni yoxlamalar **PENDING**, map release blocker-i açıqdır. iOS cihaz QA-sı BLOCKED/POSTPONED qalır.

- [ ] `cd mobile` → `npx expo start --go --tunnel --clear`; uyğun SDK 57 Expo Go ilə QR açın. Cihaz modeli, Android, Expo Go versiyası və commit-i qeyd edin.
- [ ] Xəritə tabına ilk keçiddə Bakı görünür; real public klublar marker/cluster kimi görünür.
- [ ] Pan/zoom, cluster tap, 20 sürətli marker tap: son seçim kartda qalır; kart → doğru detail → Android back işləyir.
- [ ] Kəşf et → filter → Xəritə və kiçik ekranda tablararası sürətli keçid: crash/boş xəritə yoxdur.
- [ ] Sistem/İşıqlı/Qaranlıq dəyişdirib xəritəyə qayıdın: markerlər görünür, app crash etmir; Kəşf et/Görünüş dəyişməyib.
- [ ] Şəbəkəni söndürüb xəritəni açın: native tiles gəlmirsə 15 saniyədən sonra retry görünür. Cached tiles varsa offline xəritə görünə bilər.
- [ ] Şəbəkəni bərpa edin → Xəritəni yenidən aç: fresh map yüklənir, sonsuz spinner yoxdur.
- [ ] Location permission istənmir; API key/billing yaratmaq lazım deyil.

FAIL davam edərsə: qırmızı error ekranının tam mətni/screenshot-u, Metro terminal xətası, cihazda Google Play Services mövcudluğu və xəritənin blank/crash/timeout olmasını göndərin. React error boundary native Java crash və Google tiles authorization xətasını tuta bilmir; timeout konkret səbəb diaqnozu deyil.

Uyğunluq: `react-native-maps 1.27.2` Expo SDK 57 ilə aligned-dir. Lakin [Expo-nun SDK 52 beta qeydi](https://expo.dev/changelog/2024-10-24-sdk-52-beta) Google Maps-in SDK 53-dən Android Expo Go-dan çıxarıldığını bildirir. [SDK 57 map sənədi](https://docs.expo.dev/versions/v57.0.0/sdk/map-view/) ayrıca native binary üçün Google Maps konfiqurasiyası tələb edir. Buna görə Expo Go nəticəsi release acceptance deyil.

Development build map gate — hamısı real cihazda PENDING:

- [ ] Restricted Android Maps API key `az.gameyer.app` və development signing SHA-1 ilə uyğunlaşdırılıb.
- [ ] Development APK real cihaza quraşdırılıb; `adb logcat`-də Maps authorization failure yoxdur.
- [ ] Bakı tiles-i və real klub markerləri görünür.
- [ ] Marker/cluster press, selected card və detail keçidi işləyir.
- [ ] Pan/pinch/drag və sürətli marker toxunuşlarında freeze/crash yoxdur.
- [ ] Light/Dark/System keçidində map remount crash etmir.
- [ ] 15 saniyə timeout və retry yalnız həqiqi tile failure zamanı göstərilir.

## İlk 15–20 dəqiqə

Heç bir maddəni əvvəlcədən keçmiş kimi işarələməyin. Bu ardıcıllıqla yoxlayın:

1. Təmiz launch.
2. Klubların yüklənməsi.
3. Uzun siyahıda sürətli scroll.
4. `ə, ı, ö, ü, ş, ç, ğ` ilə axtarış.
5. Tip, rayon və təsdiqlənmiş filtrləri.
6. Xəritənin açılması.
7. Xəritədə pan və pinch zoom.
8. Marker və cluster-lərə sürətli toxunuşlar.
9. Siyahı → detail → geri keçidini sürətlə təkrarlamaq.
10. Telefon, Instagram və Marşrut action-ları.
11. Wi-Fi/mobil datanı söndürmək.
12. Timeout, error və retry davranışı.
13. Şəbəkəni bərpa edib app-ın yenidən məlumat alması.

## Bug hesabatı

```text
Severity: P0 / P1 / P2 / P3
Device:
OS:
Screen:
Steps:
Expected:
Actual:
Reproducible:
Screenshot/video:
```

- P0 — crash, data/security problemi və ya test blocker-i
- P1 — əsas UX ciddi şəkildə işləmir
- P2 — nəzərəçarpan problemdir, amma istifadə mümkündür
- P3 — polish problemi

## Release-blocking ilk 10 ssenari

Hər testi ən azı bir real Android və bir real iPhone-da aparın. Crash, ağ ekran, 15 saniyədən uzun spinner, yanlış klub detalı və ya təkrarlanan detail screen release blocker-dir.

1. Təmiz install edin; düzgün splash/icon-dan sonra discovery-nin açıldığını, missing/səhv env olan ayrıca test build-də isə raw exception əvəzinə retry UI göründüyünü yoxlayın.
2. App-ı offline başladın, 15 saniyə ərzində timeout/error UI gözləyin; şəbəkəni açıb bir dəfə retry edin və siyahının bərpa olunduğunu yoxlayın.
3. Refresh zamanı şəbəkəni kəsin, dərhal list/map arasında keçin və geri qayıdın; spinner dayanmalı, son uğurlu siyahı qalmalı, paralel retry storm olmamalıdır.
4. 20 fərqli klub kartına sürətlə toxunun; yalnız bir detail screen açılmalıdır. Hardware back/iOS swipe-back ilə bir addımda siyahıya qayıdın.
5. Bir detail yüklənərkən geri qayıdıb başqa klub açın; əvvəlki klubun adı, şəkli və məlumatı heç vaxt yeni route-da görünməməlidir.
6. Xəritədə 20 markerə sürətlə toxunun, sonra cluster və marker arasında keçin; son seçim preview-də görünməli və kamera nəzarətsiz animasiya növbəsinə düşməməlidir.
7. Map/list arasında təkrar keçin, discovery-də filtri dəyişib map-a qayıdın; köhnə marker seçimi/preview bərpa olmamalı və location icazəsi istənməməlidir.
8. Şəkilli siyahını sürətlə yuxarı-aşağı scroll edin və qırıq image URL olan klub açın; scroll cavabdeh qalmalı, fallback görünməli, gallery ağ/boş sahədə ilişməməlidir.
9. Kiçik ekran və maksimum accessibility font ilə uzun ad/ünvanlı detail-i yoxlayın; badge, action-lar, qiymətlər və saatlar kəsilmədən scroll edilə bilməlidir.
10. Zəng, Instagram və Marşrut action-larını açın və ləğv edib app-a qayıdın; yalnız `tel:` və yoxlanmış HTTPS hədəflər açılmalı, dəstəklənməyən action professional alert göstərməlidir.

## Hər iki platforma

- Təmiz install, splash, GameYer icon və ilk discovery yüklənməsini yoxla.
- Wi-Fi və mobil şəbəkədə discovery siyahısını, pull-to-refresh və retry-ni yoxla.
- Offline start, request zamanı şəbəkənin kəsilməsi və yenidən qoşulma vəziyyətlərini yoxla.
- Uzun klub adı/ünvanı, şəkilsiz və qırıq şəkilli kartları yoxla.
- Search keyboard-u, clear düyməsi, keyboard dismiss və Azərbaycan hərfləri ilə axtarışı yoxla.
- PC/PlayStation, rayon və təsdiqlənmiş filtrləri ayrı-ayrılıqda və birlikdə yoxla.
- Xəritədə pan, pinch zoom, compass, marker seçimi və boş sahəyə toxunaraq seçimi bağlamağı yoxla.
- Uzaq zoom-da cluster saylarını, cluster-ə toxunaraq yaxınlaşmanı və yaxın zoom-da markerə ayrılmanı yoxla.
- Seçilmiş markerin kamera fokusunu, preview kartını və detail keçidini yoxla.
- Detail qalereyasında swipe, qırıq şəkil fallback-i, uzun mətn və bütün missing-data vəziyyətlərini yoxla.
- Telefon zəngi, yalnız rəsmi Instagram HTTPS linki və directions action-larını yoxla; cancel etdikdə app-a təhlükəsiz qayıtmalıdır.
- Kiçik ekran, böyük accessibility font ölçüsü, landscape bloklanması və tablet layout-u yoxla.
- Status bar, notch/Dynamic Island, home indicator və tab bar safe-area davranışını yoxla.
- Sistem/İşıqlı/Qaranlıq seçimində xəritə və digər ekranların kontrastını, theme dəyişərkən crash olmadığını yoxla.

## Android

- Hardware/system back və predictive back ilə detail-dən geri qayıtmağı yoxla.
- Google Maps native tiles, marker/cluster rendering və gesture-ləri ən azı bir real Play Services cihazında yoxla.
- Telefon/Instagram/directions üçün app chooser və dəstəklənməyən action alert-ini yoxla.
- Kəşf et/Xəritə açılarkən location icazəsi istənmədiyini, yalnız Yaxınlıq düyməsinin foreground icazə istədiyini təsdiqlə.

## iOS

- Navigation back swipe, scroll-to-top və gallery horizontal swipe konfliktini yoxla.
- Apple Maps əsaslı map tile, marker/cluster rendering və gesture-ləri yoxla.
- Telefon/Instagram/directions action-larını və Safari/Maps-dən app-a qayıdışı yoxla.
- Location prompt yalnız Yaxınlıq düyməsi ilə göstərilməlidir; Always/background icazə istənməməlidir.
