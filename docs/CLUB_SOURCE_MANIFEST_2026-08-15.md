# GameYer club source manifest — 2026-08-15 (ARXİV)

> **Status: tarixi sənəd, cari source-of-truth deyil.**
>
> Bu fayl 60-klub release cəhdi zamanı əlavə edilən 30 namizəd klubun ilkin mənbə manifestidir. Sonrakı dərin truth auditində koordinatsız, bağlanmış və kifayət qədər əsaslandırılmayan qeydlər public dataset-dən çıxarılıb. Bu siyahını production datasını bərpa etmək, klub sayını 60-a qaytarmaq və ya avtomatik seed etmək üçün istifadə etmək olmaz.

Cari data həqiqəti üçün bax:
- `docs/CLUB_TRUTH_AUDIT_2026-08-15.md`
- `supabase/migrations/20260815_club_data_truth_audit.sql`
- canlı Supabase `clubs where is_active = true`

## İlkin mənbə prinsipi
- Əsas mənbələr Yandex Maps, Google/business index, Waze və klubun rəsmi izi idi.
- Telefon və iş saatı yalnız açıq mənbədə tapıldıqda əlavə edilirdi.
- Sonrakı audit qaydası sərtləşdirilib: **public klub üçün istifadəyə yararlı xəritə koordinatı məcburidir**.
- `is_verified=true` yalnız klub sahibi və ya rəsmi nümayəndənin GameYer təsdiqindən sonra verilə bilər.

## Tarixi 30 namizəd
Prime Cyber Club; Bunker Racing Bar; LaLiga Lounge - AzTU; LaLiga Lounge - Gənclik; LaLiga Lounge - Elmlər 2; LaLiga Lounge - Tibb; Playstation - 20 Yanvar 35P; Paris Playstation; Yer6 Playstation; İnternet Club - Kunanbayev; Maracana Game Club; Playstation - Mirəli Seyidov; Internet Club Infiniti; Nil Gaming Club; 77 Playstation Game Room; Vegas - Yeni Günəşli; Game Mania; Fifa Playzone; Game Zone - Xudadat; Game Zone 107; Derbi Game Club; Reburn Gaming; 05 Oyun Zalı; PSG PlayStation Club; PS Playstation Club - 20 Yanvar; M3 Gaming Club; Nova Bizon Cyber; Yasamal Playstation; Fora Playstation - Həzi Aslanov; PlayStation Club - 9QGV.

Bu adların bu faylda qalması onların hazırda aktiv, təsdiqlənmiş və ya GameYer-də public olduğu demək deyil.
