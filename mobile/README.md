# GameYer Mobile

GameYer-in mövcud Supabase backend-i ilə işləyən Expo/React Native mobil tətbiqidir. Android və iOS eyni kod bazasından hazırlanır. Mobil tətbiq ayrıca database yaratmır və hazırkı mərhələdə yalnız public klub məlumatlarını oxuyur.

## Arxitektura

- Expo SDK 57 və stable Expo Router
- `ClubDataProvider` ilə vahid read-only data cache-i
- Supabase publishable key + production RLS
- Native `react-native-maps` ekranı; list scroll-u ilə gesture konflikti yoxdur
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

## Production təhlükəsizliyi

- Mobil kodda insert/update/delete və admin route-u yoxdur.
- RLS bütün authorization üçün əsas mənbədir.
- Missing data UI-da boş vəziyyət kimi göstərilir; uydurulmur.
- Production DB migrasiyası bu mobil foundation-a daxil deyil.
