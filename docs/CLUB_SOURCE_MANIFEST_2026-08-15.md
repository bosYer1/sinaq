# GameYer club source manifest — 2026-08-15

Bu sənəd final launch üçün əlavə edilən 30 klubun mənbə auditidir. Məqsəd təsdiqsiz ad/ünvan uydurmamaqdır. `is_verified=false` qalır; bu sahə yalnız klub sahibinin rəsmi təsdiqindən sonra `true` edilməlidir.

## Mənbə prinsipi
- Əsas mənbələr: Yandex Maps, Google/Business index, Waze və klubun rəsmi izi.
- Mənbədə telefon yoxdursa DB-də telefon boş saxlanılır.
- İş saatı yalnız mənbədə açıq şəkildə göstərildikdə əlavə edilir.
- Xəritə koordinatı təsdiqlənməyibsə `latitude/longitude` boş saxlanılır; səhv marker göstərməkdənsə list/detail-də real ünvan göstərilir.

## Yeni klublar
1. Prime Cyber Club — Məzahir Rüstəmov 35 — Waze; +994 70 767 77 57; 24/7.
2. Bunker Racing Bar — Nizami 121B — Yandex Maps gaming-club kateqoriyası.
3. LaLiga Lounge - AzTU — Hüseyn Cavid 76 — Yandex Maps.
4. LaLiga Lounge - Gənclik — Fətəli xan Xoyski 49H — Yandex Maps.
5. LaLiga Lounge - Elmlər 2 — Zahid Xəlilov 11 — Yandex Maps.
6. LaLiga Lounge - Tibb — Səməd Vurğun 192 — Yandex Maps.
7. Playstation - 20 Yanvar 35P — Yandex Maps.
8. Paris Playstation — Mirzəbala Məmmədzadə 37X — Yandex Maps.
9. Yer6 Playstation — Fətəli xan Xoyski 208C — Yandex Maps.
10. İnternet Club - Kunanbayev — Abay Kunanbayev 68C — Yandex Maps.
11. Maracana Game Club — Bəxtiyar Vahabzadə 64 — Yandex Maps.
12. Playstation - Mirəli Seyidov — Mirəli Seyidov 88D — Yandex Maps.
13. Internet Club Infiniti — Əli Tağızadə 4B — Yandex Maps; 24/7.
14. Nil Gaming Club — Abdulla Qarayev 48 — Yandex Maps.
15. 77 Playstation Game Room — Arif Mehdiyev 156C — Yandex Maps.
16. Vegas - Yeni Günəşli — Surxay Noçuyev 517A — Yandex Maps.
17. Game Mania — Nəsrəddin Tusi 216 — Yandex Maps.
18. Fifa Playzone — Rahib Məmmədov 236D — Yandex Maps.
19. Game Zone - Xudadat — Xudadat Məlikaslanov 11-ci döngə 123 — Yandex Maps.
20. Game Zone 107 — Abbas Fətullayev 144 — Yandex Maps.
21. Derbi Game Club — Əsildar Məmmədəliyev 30 — Yandex Maps.
22. Reburn Gaming — Lütfi Zadə 13 — Yandex Maps.
23. 05 Oyun Zalı — Cəlal Qurbanov 79 — Yandex Maps.
24. PSG PlayStation Club — Google/Business index, Bakı.
25. PS Playstation Club - 20 Yanvar — Google/Business index; +994 50 695 00 03; 24/7.
26. M3 Gaming Club — Google/Business index + Waze; 24/7.
27. Nova Bizon Cyber — Bülbül prospekti 36 — Google/Business index; +994 10 303 36 38.
28. Yasamal Playstation — Murad Mirzəyev küçəsi — Google/Business index; +994 55 824 07 74.
29. Fora Playstation - Həzi Aslanov — Google/Business index; +994 55 797 32 31.
30. PlayStation Club - 9QGV — Google/Business index; +994 77 622 96 96.

## Release qaydası
Bu migration yalnız bütün final launch taskları bitəndən sonra production-a tətbiq olunmalıdır. Tətbiqdən sonra `select count(*) from clubs where is_active=true;` nəticəsi minimum 60 olmalıdır.
