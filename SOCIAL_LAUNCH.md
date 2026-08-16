# GameYer — Social Launch Playbook

## Məqsəd
İlk sosial trafik dalğasını GameYer-in əsas dəyər təklifinə bağlamaq: **Bakıda PC və PlayStation klublarını bir yerdə tapmaq və müqayisə etmək.**

## Profil bio
**Instagram / TikTok bio**

> Bakıda PC və PlayStation klublarını tap 🎮  
> Ünvan • iş saatı • xəritə • mövcud olduqda qiymət

Sayt linki həmin anda istifadə olunan canonical production domain olmalıdır. `gameyer.az` canlı və Vercel-ə qoşulanadək mövcud GameYer production URL-i istifadə olunur.

## UTM qaydası
- Instagram: `/?utm_source=instagram&utm_medium=social&utm_campaign=launch`
- TikTok: `/?utm_source=tiktok&utm_medium=social&utm_campaign=launch`
- Klub sahibi outreach: `/klub-sahibi?utm_source=owner_outreach&utm_medium=direct&utm_campaign=verification`

Custom domain aktiv olduqda yalnız host dəyişir.

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
- Landing: `/bakida-pc-klublari?utm_source=instagram&utm_medium=social&utm_campaign=pc_clubs`

### Gün 3 — PlayStation intent
- Reel/TikTok: “PS oynamaq üçün yer axtarırsan?”
- Landing: `/bakida-playstation-klublari?utm_source=tiktok&utm_medium=social&utm_campaign=ps_clubs`

### Gün 4 — Rayon intent
- Nərimanov və ya Yasamal üzrə qısa video.
- Landing: uyğun `/rayon/{slug}` səhifəsi.
- Sonda “başqa rayon yaz, növbəti videoda baxaq” CTA.

### Gün 5 — 24/7 intent
- “Gecə gaming üçün açıq yerlər” videosu.
- Landing: `/bakida-24-saat-gaming-klublari`.

### Gün 6 — Klub detail paylaşımı
- Bir real klub detail səhifəsini göstər.
- Yeni “Klubu paylaş” funksiyası ilə istifadəçini link paylaşmağa təşviq et.
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
Admin → **Statistika** ekranında:
- günlük page view
- unikal anonim session
- ən çox baxılan səhifələr
- trafik mənbələri: Direct / Google / Instagram / Facebook / TikTok

İlk 7 gün üçün əsas KPI:
- ilk real Instagram/TikTok referral session
- ən az 1 owner verification müraciəti
- klub detail səhifələrinin ana səhifədən kənar baxış payının artması
- shared club URL-lərdən gələn trafik

## Paylaşmadan əvvəl son yoxlama
- production link 200 qaytarır
- `x-robots-tag: noindex` yoxdur
- OG şəkil production host-dan gəlir
- mobil ana səhifə və klub detail normal görünür
- Instagram/TikTok bio linkində düzgün UTM var
- yanlış klub məlumatı üçün Əlaqə / klub sahibi müraciət axını işləyir
- postda sabit klub sayı yazılmır; cari say dəyişə bilər
