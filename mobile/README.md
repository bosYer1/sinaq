# GameYer Mobile

Current foundation audit, theme support and acceptance limits: [README-mobile.md](../README-mobile.md).

GameYer-in mövcud Supabase backend-i ilə işləyən Expo/React Native mobil tətbiqidir. Android və iOS eyni kod bazasından hazırlanır. Mobil tətbiq ayrıca database yaratmır və hazırkı mərhələdə yalnız public klub məlumatlarını oxuyur.

## Arxitektura

- Expo SDK 57 və stable Expo Router
- `ClubDataProvider` ilə vahid read-only data cache-i
- Siyahı/map üçün yüngül summary query, detail açıldıqda isə slug üzrə ayrıca tam query
- Şəbəkə sorğuları üçün 15 saniyəlik sərhəd, paralel sorğu deduplication-u və məhdud detail cache-i
- Route səviyyəsində bərpa edilə bilən error boundary və sürətli təkrar keçid qoruması
- Supabase publishable key + production RLS
- Native `react-native-maps` ekranı və dependency-siz region əsaslı marker clustering-i
- Telefon, rəsmi Instagram, istiqamət və yalnız `gameyer.az/klub/...` hədəfli native paylaşma action-ları
- Route-lar: discovery, map, nearby, more, appearance, info və `club/[slug]`
- Konfiqurasiya yoxdur və ya səhvdirsə production fallback edilmir

## Lokal konfiqurasiya

`mobile/.env.example` faylını `mobile/.env.local` kimi kopyalayın və istifadə edəcəyiniz Supabase mühitini explicit yazın:

```env
EXPO_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`EXPO_PUBLIC_` dəyərləri mobil bundle-da açıq görünür. Burada yalnız publishable/legacy anon key istifadə oluna bilər; secret və service-role key qadağandır.

## Komandalar

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm run build` Android və iOS JavaScript bundle export-u yaradır. App Store/Play Store native binary signing və Android Google Maps production credential-ı ayrıca release mərhələsidir; bu repo heç bir paid map xidmətini avtomatik aktivləşdirmir.

Real cihaz release yoxlamaları üçün [DEVICE_QA.md](./DEVICE_QA.md) checklist-inə baxın.
Founder üçün qısa QR/LAN başlatma addımları [DEVICE_START.md](./DEVICE_START.md) faylındadır.

## Production təhlükəsizliyi

- Mobil kodda insert/update/delete və admin route-u yoxdur.
- RLS bütün authorization üçün əsas mənbədir.
- Missing data UI-da boş vəziyyət kimi göstərilir; uydurulmur.
- Telefon, Instagram və xəritə action-ları yalnız allowlist və format yoxlamasından keçən URL-ləri açır.
- Production DB migrasiyası bu mobil foundation-a daxil deyil.

## Dependency audit qeydi

2026-09-02 tarixində `npm audit` 14 moderate advisory göstərir. Çoxu Expo config/CLI və `xcode -> uuid` build tooling zəncirindədir; `expo-router -> query-string -> decode-uri-component` isə malformed deep-link input üçün potensial DoS yoludur. npm-in təklif etdiyi avtomatik həll Expo/Router major downgrade-dir və SDK 57-ni pozduğu üçün tətbiq edilməyib. Mobil route-larda admin/privileged davranış yoxdur, slug və xarici URL-lər ayrıca allowlist olunur, lakin Expo SDK 57-compatible upstream patch çıxana qədər advisory açıq riskdir.
