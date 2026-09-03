# GameYer — Social Launch Playbook

## Məqsəd
İlk sosial trafik dalğasını GameYer-in əsas dəyər təklifinə bağlamaq: **Bakıda PC və PlayStation klublarını bir yerdə tapmaq və müqayisə etmək.**

## Profil bio
**Instagram / TikTok bio**

> Bakıda PC və PlayStation klublarını tap 🎮  
> Ünvan • iş saatı • xəritə • mövcud olduqda qiymət

Profil və post linkləri canonical production domain olan `https://gameyer.az` üzərindən verilməlidir.

## UTM qaydası
Məqsəd təkcə sosial şəbəkədən neçə istifadəçi gəldiyini yox, **hansı postun hansı discovery və conversion davranışını yaratdığını** ayırmaqdır.

### Canonical source / medium
- Instagram organic: `utm_source=instagram&utm_medium=organic_social`
- TikTok organic: `utm_source=tiktok&utm_medium=organic_social`
- Facebook organic: `utm_source=facebook&utm_medium=organic_social`
- Meta paid: kampaniyada istifadə olunan platform source saxlanılır, `utm_medium=paid_social`
- Klub sahibi outreach: `utm_source=owner_outreach&utm_medium=direct`

`ig` kimi köhnə source alias-ları tarixi datada qala bilər. Onları geriyə dönük dəyişmə; yeni organik Instagram linklərində canonical `instagram` istifadə et.

### Campaign / content
- `utm_campaign` istifadəçi niyyətini göstərir: məsələn `club_discovery`, `pc_clubs`, `ps_clubs`, `nearby`, `owner_verification`.
- `utm_content` konkret postu və kreativi ayırır: məsələn `find_club_01`, `search_demo_01`, `pc_filter_01`.
- Eyni post Instagram və TikTok-da paylaşılırsa `campaign` və `content` eyni qala bilər, yalnız `source` dəyişir.
- `fbclid` və platformanın avtomatik click ID-lərini əl ilə əlavə etmə və silmə.

### Cari nümunələr
- Instagram — klub discovery: `/?utm_source=instagram&utm_medium=organic_social&utm_campaign=club_discovery&utm_content=find_club_01`
- Instagram — axtarış demo: `/?utm_source=instagram&utm_medium=organic_social&utm_campaign=club_discovery&utm_content=search_demo_01`
- Instagram — PC intent: `/bakida-pc-klublari?utm_source=instagram&utm_medium=organic_social&utm_campaign=pc_clubs&utm_content=pc_filter_01`
- Instagram — PlayStation intent: `/bakida-playstation-klublari?utm_source=instagram&utm_medium=organic_social&utm_campaign=ps_clubs&utm_content=ps_filter_01`
- Instagram — yaxınlıq intent: `/yaxinliqda-gaming-klublari?utm_source=instagram&utm_medium=organic_social&utm_campaign=nearby&utm_content=nearby_01`
- TikTok üçün yuxarıdakı linklərdə yalnız `utm_source=tiktok` dəyişir.
- Klub sahibi outreach: `/klub-sahibi?utm_source=owner_outreach&utm_medium=direct&utm_campaign=owner_verification&utm_content=club_dm`

## İlk launch postu
**Başlıq:**
> Bakıda oyun klubu axtarmaq artıq daha rahatdır. 🎮

**Mətn:**
> GameYer-də Bakıdakı PC və PlayStation klublarını bir yerdə görə, rayon və klub tipinə görə filtr edə, ünvanı, xəritəni, iş saatlarını və mövcud olduqda qiymətləri müqayisə edə bilərsən.
>
> Platformadakı klub məlumatları say çoxaltmaq üçün deyil, xəritə və açıq mənbələrlə yoxlanmış aktiv dataset prinsipi ilə saxlanılır. Məlumatı səhv və ya köhnə olan klub görsən, GameYer üzərindən düzəliş göndərə bilərsən.

**CTA:**
> Klubunu tap → profildəki link

## İlk qısa video / Reel / TikTok ssenarisi
1. 0–2 san: “Bakıda PC/PS klubu axtarırsan?”
2. 2–5 san: GameYer ana səhifəsi və aktiv klub xəritəsi.
3. 5–8 san: PC / PlayStation / rayon filtrləri.
4. 8–11 san: xəritədə markerlər və “Yaxınlığıma görə”.
5. 11–14 san: klub detail — ünvan, saat, qiymət varsa qiymət.
6. 14–16 san: “GameYer — klubunu tap.” + profil linki.

## 7 günlük no-budget trafik planı

### Gün 1 — Launch
- Instagram Reel + TikTok: GameYer nədir?
- Bio link: ana səhifə UTM-li URL.
- Story: “Sənin klubun GameYer-də var?”

### Gün 2 — PC intent
- Reel/TikTok: “Bakıda PC klubu axtarırsansa…”
- Landing: `/bakida-pc-klublari?utm_source=instagram&utm_medium=organic_social&utm_campaign=pc_clubs&utm_content=pc_filter_01`

### Gün 3 — PlayStation intent
- Reel/TikTok: “PS oynamaq üçün yer axtarırsan?”
- Landing: `/bakida-playstation-klublari?utm_source=tiktok&utm_medium=organic_social&utm_campaign=ps_clubs&utm_content=ps_filter_01`

### Gün 4 — Rayon intent
- Nərimanov və ya Yasamal üzrə qısa video.
- Landing: uyğun `/rayon/{slug}` səhifəsi və post-specific UTM.
- Sonda “başqa rayon yaz, növbəti videoda baxaq” CTA.

### Gün 5 — 24/7 intent
- “Gecə gaming üçün açıq yerlər” videosu.
- Landing: `/bakida-24-saat-gaming-klublari` + post-specific UTM.

### Gün 6 — Klub detail paylaşımı
- Bir real klub detail səhifəsini göstər.
- İstifadəçini klub səhifəsini paylaşmağa təşviq et.
- Klub seçərkən yalnız cari audit edilmiş məlumatdan istifadə et.

### Gün 7 — Data/trust postu
- “GameYer-də məlumat necə yoxlanılır?”
- Məlumat metodologiyası + səhv bildirmə + klub sahibi təsdiqi göstərilsin.

## Owner verification outreach
İlk mərhələdə rəsmi Instagram izi və ya açıq telefon əlaqəsi olan klublardan başla.

**Qısa DM mətni:**
> Salam. GameYer-də klubunuz üçün məlumat səhifəsi yaradılıb. Platforma Bakıdakı PC və PlayStation klublarını xəritə və məlumatlarla bir yerdə göstərir. Klub məlumatlarının sizə aid olduğunu pulsuz təsdiqləyə, ünvan, telefon, iş saatı, qiymət və şəkillər üzrə düzəliş göndərə bilərsiniz: [klub-sahibi linki]

**Qayda:**
- Bir klubla eyni gün təkrar-təkrar əlaqə saxlamamaq.
- Müraciətdə “premium alın” tipli satış etməmək; ilk məqsəd data təsdiqidir.
- Klub cavab verərsə, əvvəlcə sahiblik/rəsmi nümayəndəlik doğrulansın.
- Şəkil istəyərkən klubun istifadə icazəsini açıq şəkildə almaq.

## Kontent mövzuları
- Bakıda 24 saat işləyən gaming klubları
- Nərimanovda PC klubları
- Yasamalda PlayStation klubları
- Saatlıq qiyməti təsdiqlənmiş klublar
- “Sən hansı klubda oynayırsan?” engagement postu

## Launch ölçümü
Founder Analytics / PostHog və first-party statistikada:
- pageviews, unique users və sessions
- top landing / public pages
- Instagram / Facebook / TikTok / Google / direct source
- `club_card_click`
- `club_view`
- `maps_click`, `instagram_click`, `phone_click`
- successful submissions

Əsas conversion KPI:
- **club card click → club detail view → contact action**
- contact action = Maps, Instagram və ya telefon klikidir
- test/synthetic browser trafikini real nəticəyə qatma
- post nəticəsini `utm_campaign` + `utm_content` ilə ayrıca müqayisə et

## Paylaşmadan əvvəl son yoxlama
- production link 200 qaytarır
- indexable landing-də `x-robots-tag: noindex` yoxdur
- OG şəkil production host-dan gəlir
- mobil ana səhifə və klub detail normal görünür
- Instagram/TikTok bio və post linkində düzgün UTM var
- `utm_content` konkret postu identifikasiya edir
- yanlış klub məlumatı üçün Əlaqə / klub sahibi müraciət axını işləyir
- postda sabit klub sayı yazılmır; cari say dəyişə bilər
