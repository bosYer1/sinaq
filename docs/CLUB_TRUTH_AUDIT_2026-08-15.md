# GameYer club truth audit — 2026-08-16

## Qayda
GameYer public kataloqunda klub sayı yox, məlumat həqiqiliyi prioritetdir. Public klubun istifadəyə yararlı koordinatı olmalıdır. Telefon, iş saatı, qiymət və sosial hesab yalnız uyğun biznes izi ilə əsaslandırıldıqda əlavə olunur. Mənbələr ziddiyyətlidirsə sahə boş saxlanılır və ya konflikt sənədləşdirilir.

## Cari canlı vəziyyət
- Aktiv public klub: **35**
- Koordinatsız aktiv klub: **0**
- Telefonu boş qalan: **4**
- İş saatı boş qalan: **4**
- Instagram boş qalan: **28**
- Qiymət məlumatı olmayan: **31**
- Öz storage-mızda klub şəkli olmayan: **35**
- Klub sahibi/rəsmi nümayəndə tərəfindən təsdiqlənmiş (`is_verified=true`): **0**

## Public reytinq siyasəti
Xarici xəritə/business indekslərindən götürülmüş rating snapshot-ları GameYer-in öz istifadəçi rəyləri deyil. Buna görə public query qatında rating dəyərləri göstərilmir və structured data-ya `AggregateRating` kimi ötürülmür. GameYer first-party review sistemi qurulana qədər reytinq public məhsul siqnalı sayılmır.

## Auditdə tətbiq edilmiş əsas düzəlişlər
- Koordinatsız klub qeydləri public dataset-dən çıxarılıb.
- `Level Up Gaming Club` bağlı göstərildiyi üçün deaktiv edilib.
- `PLAYROOMS GAMECLUB` bir neçə cari kataloqda closed kimi göründüyü üçün deaktiv edilib.
- `FIFA Cyber Club`: `Sülh küçəsi 242, Bakı`, Sabunçu kimi düzəldilib.
- `ButaCyberCafe`: rəsmi Instagram, audit olunmuş iş qrafiki və 2 AZN/saatdan PC qiyməti əlavə edilib.
- `Vegas Gaming Center - Həzi Aslanov` və `Vegas Gaming Club - Mərkəz`: `@vegasgamingcenter` əlavə edilib.
- `Game Stop Playstation Club`: hər gün 12:00–03:00.
- `The best gaming arena`: `+994 55 603 05 05`.
- `GAME CLUB`: ikinci cari kontakt əlavə edilib.
- Sarayevo küçəsi 32 qeydi cari kataloq adına uyğun `Adsız Playstation klub` kimi saxlanılır.
- `Paris Playstation`: cari business index ilə `+994 77 550 33 34`, hər gün 11:00–00:00 təsdiqlənib.
- `Yasamal Playstation`: `Yeni Yasamal 2, Bakı`, `+994 55 824 07 74`, hər gün 10:00–00:00.

## Hazırda bilərəkdən boş saxlanılan kritik sahələr
### Telefon
- Adsız Playstation klub — Sarayevo küçəsi 32
- Drive Mood Baku — Fətəli Xan Xoyski 132
- İmperator Playstation Club — Təbriz küçəsi
- Qardawlar PS Club — Sabit Orucov küçəsi

### İş saatı
- Galatasaray Playstation Club
- Game Tea PlayStation
- İmperator Playstation Club
- Real Club PlayStation

## Açıq data konfliktləri
- `Milli Gaming Arena`: business/map mənbələri Təbriz küçəsi 95/97 tərəfini, klubun öz sayt footer-i isə Ağa Nemətulla 120 ünvanını göstərib. Telefon `+994 77 616 00 11` uyğun gəlir. Daha güclü relocation/filial təsdiqi olmadan dəyişdirilmir.
- `Avallon Gaming`: ünvan variantları mövcuddur; Təbriz 94 bir neçə cari mənbədə göründüyü üçün mövcud DB saxlanılır.
- `Kenza Gaming Lounge`: cari mənbələrdə Puşkin 54B və Fikrət Əmirov 24 variantları çıxır. Eyni telefon izi relocation/filial ehtimalını göstərir; rəsmi təsdiq olmadan avtomatik dəyişiklik edilmir.
- `IGROTEKA CYBER CLUB` və `Marvel PS Club & Lounge`: ayrıca real biznes kimi təsdiqlənirlər, lakin DB-də eyni koordinatı paylaşırlar. Dəqiq giriş/marker koordinatı əlavə mənbə ilə təsdiqlənməlidir.

## Source-of-truth qaydası
1. Canlı Supabase aktiv dataset.
2. Bu truth-audit sənədi.
3. `20260815_club_data_truth_audit.sql` və ondan sonrakı düzəliş migration-ları.
4. `CLUB_SOURCE_MANIFEST_2026-08-15.md` yalnız tarixi arxivdir və restore üçün source-of-truth deyil.

Şəkil, qiymət və owner verification boşluqları məlumat uydurmaqla doldurulmamalıdır.
