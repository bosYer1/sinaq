# GameYer device QA checklist

Bu checklist real Android və iOS cihazında release candidate yoxlaması üçündür. Aşağıdakı maddələr desktop bundle export ilə təsdiqlənmiş sayılmır.

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
- Sistem light və dark rejimlərində app-ın qəsdən light theme saxladığını və kontrastın pozulmadığını yoxla.

## Android

- Hardware/system back və predictive back ilə detail-dən geri qayıtmağı yoxla.
- Google Maps native tiles, marker/cluster rendering və gesture-ləri ən azı bir real Play Services cihazında yoxla.
- Telefon/Instagram/directions üçün app chooser və dəstəklənməyən action alert-ini yoxla.
- Location icazəsinin istənmədiyini təsdiqlə.

## iOS

- Navigation back swipe, scroll-to-top və gallery horizontal swipe konfliktini yoxla.
- Apple Maps əsaslı map tile, marker/cluster rendering və gesture-ləri yoxla.
- Telefon/Instagram/directions action-larını və Safari/Maps-dən app-a qayıdışı yoxla.
- Location permission prompt-un görünmədiyini təsdiqlə.
