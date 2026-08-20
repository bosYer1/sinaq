# GameYer Mobile

GameYer-in mövcud Supabase backend-i ilə işləyən Expo/React Native mobil tətbiqidir. Android və iOS eyni kod bazasından hazırlanır. Mobil tətbiq ayrıca database yaratmır və hazırkı mərhələdə yalnız public klub məlumatlarını oxuyur.

## Arxitektura

- Expo SDK 57 və stable Expo Router
- `ClubDataProvider` ilə vahid read-only data cache-i
- Siyahı/map üçün yüngül summary query, detail açıldıqda isə slug üzrə ayrıca tam query
- Şəbəkə sorğuları üçün 15 saniyəlik sərhəd, paralel sorğu deduplication-u və məhdud detail cache-i
- Route səviyyəsində bərpa edilə bilən error boundary və sürətli təkrar keçid qoruması
- Supabase publishable key + production RLS
- Native `react-native-maps` ekranı və dependency-siz region əsaslı marker clustering-i
- Route-lar: discovery, map, `club/[slug]`
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

2026-08-20 tarixində `npm audit` 8 high və 8 moderate transitive advisory göstərir. Bunlar Expo CLI/Metro build zəncirindəki `image-size` (build zamanı xüsusi ICNS/JXL/HEIF fayllarının parse edilməsi) və `xcode -> uuid` asılılıqlarından gəlir; tətbiqin runtime bundle-ında uzaq input emal edən kod yolu deyil. `image-size` üçün audit-in göstərdiyi 2.0.3 hələ npm-də yayımlanmayıb, `uuid`-u major override etmək isə Expo-nun xcode tooling-ni poza bilər. Audit-in yeganə avtomatik təklifi Expo 57-dən 53-ə breaking downgrade olduğuna görə tətbiq edilməyib. Expo 57 uyğun patch buraxdıqda ayrıca yenilənməlidir.
