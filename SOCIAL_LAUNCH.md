# GameYer — Social Launch Playbook

## Məqsəd
İlk sosial trafik dalğasını GameYer-in əsas dəyər təklifinə bağlamaq: **Bakıda PC və PlayStation klublarını bir yerdə tapmaq və müqayisə etmək.**

## Profil bio
**Instagram / TikTok bio**

> Bakıda PC və PlayStation klublarını tap 🎮  
> Ünvan • qiymət • iş saatı • xəritə

Sayt linki həmişə həmin anda istifadə olunan canonical production domain olmalıdır. `gameyer.az` canlı və Vercel-ə qoşulanadək mövcud GameYer production URL-i istifadə olunur.

## UTM qaydası
Sosial trafikin admin statistikada və gələcək analitikada ayrılması üçün kampaniya linkləri:

- Instagram: `/?utm_source=instagram&utm_medium=social&utm_campaign=launch`
- TikTok: `/?utm_source=tiktok&utm_medium=social&utm_campaign=launch`

Custom domain aktiv olduqda yalnız host dəyişir; query parametrləri eyni qalır.

## İlk launch postu
**Başlıq:**

> Bakıda oyun klubu axtarmaq artıq daha rahatdır. 🎮

**Mətn:**

> GameYer-də Bakıdakı PC və PlayStation klublarını bir yerdə görə, rayon və klub tipinə görə filtr edə, ünvanı, xəritəni, iş saatlarını və mövcud olduqda qiymətləri müqayisə edə bilərsən.
>
> Platformada artıq 60 real klub var. Məlumatı səhv və ya köhnə olan klub görsən, GameYer üzərindən düzəliş göndərə bilərsən.

**CTA:**

> Klubunu tap → profildəki link

## İlk qısa video / Reel / TikTok ssenarisi
1. 0–2 san: “Bakıda PC/PS klubu axtarırsan?”
2. 2–5 san: GameYer ana səhifəsi və 60 klub göstəricisi.
3. 5–8 san: PC / PlayStation / rayon filtrləri.
4. 8–11 san: xəritədə markerlər və “Yaxınlığıma görə”.
5. 11–14 san: klub detail — ünvan, saat, qiymət varsa qiymət.
6. 14–16 san: “GameYer — klubunu tap.” + profil linki.

## İkinci kontent dalğası
- “Bakıda 24 saat işləyən gaming klubları”
- “Nərimanovda PC klubları”
- “Yasamalda PlayStation klubları”
- “Saatlıq qiyməti məlum olan klublar”
- “Sən hansı klubda oynayırsan?” engagement postu

## Launch ölçümü
Admin → **Statistika** ekranında launchdan sonra bunlara bax:
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
