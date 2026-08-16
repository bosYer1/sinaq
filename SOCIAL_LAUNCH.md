# GameYer — No-budget Social & Owner Growth Playbook

## Məqsəd
GameYer-in ilk real trafik və klub-sahibi təsdiq dalğasını reklam büdcəsi olmadan başlatmaq.

Əsas dəyər təklifi: **Bakıda PC və PlayStation klublarını bir yerdə tapmaq, müqayisə etmək və xəritədə görmək.**

## Cari canonical link
Custom domain alınana qədər:

`https://gameyerr-gameyer.vercel.app`

Bütün bio, post və outreach linkləri bu hosta baxmalıdır. Domain dəyişəndə yalnız host dəyişdirilir.

## Profil bio
**Instagram / TikTok bio**

> Bakıda PC və PlayStation klublarını tap 🎮  
> Ünvan • iş saatı • xəritə • mövcud olduqda qiymət

## UTM qaydası
- Instagram bio: `/?utm_source=instagram&utm_medium=social&utm_campaign=launch`
- TikTok bio: `/?utm_source=tiktok&utm_medium=social&utm_campaign=launch`
- Instagram story: `/?utm_source=instagram&utm_medium=story&utm_campaign=launch`
- Klub owner outreach: `/klub-sahibi?utm_source=owner_outreach&utm_medium=direct&utm_campaign=verification`

Kontent konkret landing page-ə gedirsə UTM həmin route-a əlavə olunur.

## 7 günlük ilk trafik planı

### Gün 1 — GameYer nədir?
Video: ana səhifə → filter → xəritə → klub detail.

Hook: **“Bakıda PC/PS klubu axtarmaq üçün 10 ayrı səhifəyə baxmağa ehtiyac yoxdur.”**

CTA: `GameYer-də klubunu tap`.

### Gün 2 — 24 saat klublar
Landing:
`/bakida-24-saat-gaming-klublari?utm_source=instagram&utm_medium=social&utm_campaign=24hour`

Yalnız GameYer-də iş saatı ilə təsdiqlənmiş klublardan istifadə et.

### Gün 3 — PC klubları
Landing:
`/bakida-pc-klublari?utm_source=tiktok&utm_medium=social&utm_campaign=pc-clubs`

Hook nümunəsi: **“Bakıda PC klub axtarırsansa bu siyahını saxla.”**

### Gün 4 — PlayStation klubları
Landing:
`/bakida-playstation-klublari?utm_source=instagram&utm_medium=social&utm_campaign=ps-clubs`

### Gün 5 — Rayon kontenti
Yalnız cari datasetdə aktiv klubu olan rayonlardan istifadə et.

Məsələn:
- `/rayon/narimanov`
- `/rayon/yasamal`
- `/rayon/sabail`
- `/rayon/xatai`
- `/rayon/nasimi`
- `/rayon/sabuncu`

### Gün 6 — Məlumat etibarı
Kontent ideyası: **“GameYer-də klub məlumatlarını necə yoxlayırıq?”**

Landing: `/melumat-metodologiyasi`

Vurğu:
- fake klub əlavə edilmir;
- dəqiq olmayan koordinat public xəritədə saxlanmır;
- qiymət/saat tapılmadıqda uydurulmur;
- klub sahibi düzəliş və təsdiq göndərə bilər.

### Gün 7 — Klub sahibisən?
Landing:
`/klub-sahibi?utm_source=instagram&utm_medium=social&utm_campaign=owner-verification`

CTA: **“Klubunuz GameYer-dədirsə məlumatınızı ödənişsiz təsdiqləyin.”**

## Owner verification outreach

### Prioritet 1 — rəsmi Instagramı artıq məlum olan klublar
Əvvəlcə bu qrupdan başla, çünki DM vasitəsilə rəsmi nümayəndəyə çatmaq ehtimalı daha yüksəkdir:
- ButaCyberCafe
- Vegas Gaming Club / Vegas Gaming Center
- LaLiga Game Center
- Forsaj Game Club
- Galatasaray Playstation Club
- Kenza Gaming Lounge

### Prioritet 2 — public telefon əlaqəsi olan klublar
Instagramı tapılmayan, amma açıq biznes telefonu olan klublara qısa WhatsApp/SMS və ya zəng sonrası link göndərilə bilər.

### Outreach mətni
> Salam. GameYer Azərbaycandakı PC və PlayStation klublarını bir platformada toplayan gaming-club kataloqudur. Klubunuz üçün artıq məlumat səhifəsi yaradılıb. Məlumatların düzgünlüyünü ödənişsiz təsdiqləyə, iş saatı, qiymət, Instagram və şəkilləri rəsmi məlumatla yeniləyə bilərsiniz: [klubun GameYer linki]
>
> Təsdiq səhifəsi: https://gameyerr-gameyer.vercel.app/klub-sahibi

Şifrə, SMS kodu və hesab girişi istənilmir.

## Paylaşım dövrəsi
Hər klub detail səhifəsində **“Klubu paylaş”** funksiyası var. Mobil cihazlarda native share sheet, uyğun olmayan cihazlarda link kopyalama işləyir.

Owner təsdiqdən sonra klub sahibinə birbaşa öz GameYer profil linkini vermək lazımdır. Məqsəd odur ki, klub həmin linki Instagram story/bio-da özü də paylaşsın. Bu həm referral trafik, həm də brand mention yaradır.

## Kontent qaydaları
- Sabit klub sayı post mətninə yazma; dataset dəyişə bilər.
- “Ən yaxşı” ifadəsini first-party rating/review sistemi olmadan işlətmə.
- “Ən ucuz” yalnız kifayət qədər cari qiymət datası olduqda istifadə edilə bilər.
- Hardware/spec məlumatını rəsmi təsdiq olmadan yazma.
- Hər video bir konkret landing page-ə aparsın; hər şeyi ana səhifəyə yığma.

## Ölçüm
Admin → **Statistika** ekranında:
- günlük page view;
- unikal anonim session;
- ən çox baxılan səhifələr;
- Direct / Google / Instagram / Facebook / TikTok mənbələri.

İlk mərhələdə izlənəcək KPI-lar:
1. social referral session;
2. ən çox açılan klub profilləri;
3. owner claim sayı;
4. owner tərəfindən təsdiqlənən klub sayı;
5. Google Search impression başlayıb-başlamaması.

## Paylaşmadan əvvəl son yoxlama
- production link 200;
- `x-robots-tag: noindex` yoxdur;
- canonical production hosta baxır;
- mobil ana səhifə və klub detail normaldır;
- bio linkində UTM var;
- yanlış məlumat üçün Əlaqə / owner claim işləyir;
- postda təsdiqlənməmiş qiymət, saat, hardware və rating yoxdur.
