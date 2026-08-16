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

## Paylaşmadan əvvəl son yoxlama
- production link 200 qaytarır
- `x-robots-tag: noindex` yoxdur
- OG şəkil production host-dan gəlir
- mobil ana səhifə və klub detail normal görünür
- Instagram/TikTok bio linkində düzgün UTM var
- yanlış klub məlumatı üçün Əlaqə / klub sahibi müraciət axını işləyir
- postda sabit klub sayı yazılmır; cari say dəyişə bilər
