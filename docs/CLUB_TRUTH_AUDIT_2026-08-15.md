# GameYer club truth audit — 2026-08-15

## Qayda
GameYer public kataloqunda say yox, məlumat həqiqiliyi prioritetdir. Koordinatı olmayan klub saxlanılmır. Telefon, iş saatı, qiymət və sosial hesab yalnız uyğun biznes izi ilə əsaslandırıldıqda əlavə olunur. Mənbələr ziddiyyətlidirsə sahə boş saxlanılır.

## Audit nəticəsi
- Aktiv public klub: **35**
- Koordinatsız aktiv klub: **0**
- Telefonu boş qalan: **5**
- İş saatı boş qalan: **4**
- Instagram boş qalan: **28**
- Qiymət məlumatı olmayan: **31**
- Öz storage-mızda klub şəkli olmayan: **35**

## Auditdə tətbiq edilən əsas düzəlişlər
- Koordinatsız klub qeydləri public dataset-dən çıxarıldı.
- `Level Up Gaming Club` cari xəritə mənbəsində bağlı göstərildiyi üçün deaktiv edildi.
- `PLAYROOMS GAMECLUB` iki müstəqil cari kataloqda closed kimi göstərildiyi üçün deaktiv edildi.
- `FIFA Cyber Club`: ünvan `Sülh küçəsi 242, Bakı`, rayon Sabunçu kimi düzəldildi.
- `ButaCyberCafe`: rəsmi Instagram əlavə edildi; cari həftəlik iş qrafiki tətbiq edildi; PC qiyməti 2 AZN/saatdan qeyd edildi.
- `Vegas Gaming Center - Həzi Aslanov` və `Vegas Gaming Club - Mərkəz`: rəsmi `@vegasgamingcenter` hesabı əlavə edildi.
- `Game Stop Playstation Club`: hər gün 12:00–03:00 qrafiki əlavə edildi.
- `The best gaming arena`: cari telefon `+994 55 603 05 05` olaraq yeniləndi.
- `GAME CLUB`: ikinci cari kontakt əlavə edildi.
- Sarayevo küçəsi 32-dəki qeydin cari kataloq adı `Adsız Playstation klub` olaraq uyğunlaşdırıldı.
- `Paris Playstation`: cari mənbələr telefon üzrə bir-birinə zidd olduğuna görə yanlış nömrə göstərməmək üçün telefon boş saxlanıldı.
- `Yasamal Playstation`: dəqiq Waze izi ilə `Yeni Yasamal 2, Bakı`, `+994 55 824 07 74`, hər gün 10:00–00:00 təsdiqləndi.

## Hazırda bilərəkdən boş saxlanılan kritik sahələr

### Telefon tapılmayan / kifayət qədər təsdiqlənməyən
- Adsız Playstation klub — Sarayevo küçəsi 32
- Drive Mood Baku — Fətəli Xan Xoyski 132
- İmperator Playstation Club — Təbriz küçəsi
- Paris Playstation — bir neçə ziddiyyətli telefon olduğuna görə boş saxlanılır
- Qardawlar PS Club — Sabit Orucov küçəsi

### İş saatı kifayət qədər təsdiqlənməyən
- Galatasaray Playstation Club
- Game Tea PlayStation
- İmperator Playstation Club
- Real Club PlayStation

## Xüsusi ziddiyyət qeydləri
- `Milli Gaming Arena`: cari Waze, Cybo və Buro nəticələri Təbriz küçəsi 95/97 tərəfini göstərir; klubun öz sayt footer-i isə 120 Ağa Nemətulla ünvanını göstərir. Telefon bütün əsas mənbələrdə `+994 77 616 00 11` olaraq üst-üstə düşür. Daha güclü filial/relocation təsdiqi gələnə qədər DB ünvanı dəyişdirilmir.
- `Paris Playstation`: cari kataloqlarda eyni obyekt üçün müxtəlif telefonlar göstərilir. Etibarlı vahid telefon çıxana qədər telefon public edilmir.
- `Avallon Gaming`: müxtəlif kataloqlarda ünvan variantları var; 94 Təbriz izi bir neçə cari mənbədə mövcuddur. Mövcud DB ünvanı saxlanılır.

## İstifadə olunan mənbə sinifləri
Cari xəritə/business indeksləri (Waze, Yandex Maps, 2GIS), klubun rəsmi saytı, rəsmi sosial izi və Azərbaycan biznes kataloqları (Gun.az, GoMap, Navigator və s.) müqayisə edilib. Bir mənbədəki məlumat digər obyektlə qarışa bilirsə ad + ünvan + telefon kombinasiyası ilə ikinci yoxlama aparılıb.

## Sonrakı data işi
Instagram və qiymət sahələri çox klubda həqiqətən public deyil. Bu sahələr klub sahibinin təsdiqi, rəsmi sosial səhifə və ya aktual qiymət menyusu tapılana qədər boş qalmalıdır. Şəkillər isə müəllif hüququ və mənbə sabitliyi səbəbilə üçüncü tərəf şəkillərini avtomatik kopyalamaqla doldurulmamalıdır; klub sahiblərindən və ya istifadəsinə icazə verilən materiallardan toplanmalıdır.
