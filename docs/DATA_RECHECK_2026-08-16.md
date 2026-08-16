# GameYer — Data recheck 2026-08-16

Bu sənəd production dataset üçün yenidən yoxlanmış, amma avtomatik dəyişdirilməməli məlumat boşluqlarını qeyd edir.

## Qayda
- Tək bir kataloq izi ilə telefon, qiymət, iş saatı və sosial hesab yazılmır.
- Ünvan/koordinat konflikti varsa həmin klubun yeni məlumatı production-a avtomatik tətbiq edilmir.
- Dəqiq sübut tapılmayan sahə boş qalır.

## Drive Mood Baku
- Canlı DB-də klub aktivdir və koordinatı mövcuddur.
- Cari web nəticələrində eyni ad üçün Fətəli Xan Xoyski 132 və 166Q kimi fərqli ünvan izləri görünür.
- Waze cari listing-də 10:00–23:00 iş saatı göstərir, lakin ünvan konflikti tam bağlanmadığı üçün bu saatlar hələ DB-yə yazılmır.
- Telefon üçün etibarlı uyğunlaşan mənbə tapılmayıb.
- Status: HOLD — ünvan/koordinat ayrıca yenidən təsdiqlənməlidir.

## Qardawlar PS Club
- Cari kataloq nəticələri klubun mövcudluğunu və Sabit Orujov küçəsi lokasiyasını dəstəkləyir.
- Etibarlı telefon nömrəsi göstərilmir.
- Dəqiq həftəlik iş qrafiki tapılmayıb.
- Status: KEEP EMPTY — telefon və saat uydurulmur.

## Galatasaray Playstation Club
- Cari Gun.az nəticəsi DB-də olan telefon və Instagram izini dəstəkləyir.
- Dəqiq iş saatı həmin mənbədə göstərilmir.
- Status: HOURS EMPTY — əlavə etibarlı mənbə tapılanadək.

## Game Tea PlayStation
- Cari Gun.az nəticəsi DB-də olan iki telefon nömrəsini dəstəkləyir.
- Dəqiq iş saatı göstərilmir.
- Status: HOURS EMPTY — əlavə etibarlı mənbə tapılanadək.

## Real Club PlayStation
- Yenidən axtarışda etibarlı həftəlik iş qrafiki tapılmayıb.
- Status: HOURS EMPTY.

## İmperator Playstation Club
- Telefon və həftəlik iş qrafiki üçün kifayət qədər etibarlı, eyni Bakı obyektinə bağlanan mənbə tapılmayıb.
- Oxşar adla Gəncə obyektləri çıxdığı üçün avtomatik uyğunlaşdırma təhlükəlidir.
- Status: KEEP EMPTY.

## Nəticə
Bu yoxlamada production data dəyişdirilməməlidir. Əsas məqsəd yanlış tamlıq yaratmaq yox, source-of-truth keyfiyyətini qorumaqdır.
