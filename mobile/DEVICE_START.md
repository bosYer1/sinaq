# GameYer-i real cihazda aç

1. Kompüterdə Node.js 24 və npm, Android telefonda isə ən son Expo Go quraşdırılmış olmalıdır. Kompüter və telefon eyni Wi-Fi şəbəkəsində olsun.
2. `mobile/.env.example` faylını `mobile/.env.local` kimi kopyalayın. Ora yalnız seçilmiş mühitin public Supabase URL-ni və publishable key-ni yazın; secret/service-role key yazmayın.
3. Terminalda dependency-ləri quraşdırın:
   ```bash
   cd mobile
   npm ci
   ```
4. Eyni terminalda Metro-nu LAN rejimində başladın:
   ```bash
   npm start
   ```
5. Android: Expo Go-nu açın və terminaldakı QR kodu skan edin.
6. iPhone: hazırkı App Store Expo Go versiyası SDK 57-ni aça bilmədiyi üçün aşağıdakı iOS bölməsinə baxın; QR kod bu native uyğunsuzluğu həll etmir.
7. QR/LAN işləmirsə VPN-i söndürün, Windows Firewall-da Node-a private-network icazəsi verin və guest Wi-Fi istifadə etməyin. Son fallback:
   ```bash
   npx expo start --tunnel
   ```
8. Metro-nu dayandırmaq üçün `Ctrl+C` basın. Təmiz restart:
   ```bash
   npx expo start --clear
   ```
9. Bütün mobil yoxlamaları yenidən işlətmək üçün:
   ```bash
   npm run lint && npm run typecheck && npm test
   ```
10. `.env.local` faylını heç vaxt commit və ya paylaşmayın.

## Android xəritə development build-i

SDK 57 `react-native-maps`-i Expo Go-da daxil edir, lakin GameYer-in keyless config-i native xəritəni qəsdən deaktiv edir və Expo Go nəticəsi Android release acceptance sayılmır. Xəritəli acceptance build-i aşağıdakı restricted-key native yolu tələb edir; app özü billing-i avtomatik aktivləşdirmir.

- Pulsuz lokal build üçün Windows-da Android Studio/SDK, JDK və USB debugging lazımdır. Bu kompüterdə hazırda Android SDK/ADB aşkarlanmayıb.
- Xəritəli development build üçün Google Cloud-da Maps SDK for Android aktiv, billing-ə bağlı və `az.gameyer.app` + debug SHA-1 ilə məhdudlaşdırılmış API key tələb olunur. Founder icazəsi olmadan yaradılmamalıdır.
- İcazədən və lokal setup-dan sonra key-i yalnız ignored `.env.local`-da `GOOGLE_MAPS_API_KEY_ANDROID` kimi yazın və işlədin:
  ```bash
  npm run android:dev
  npm run start:dev-client
  ```
- EAS alternativi Expo hesabı və build kvotası tələb edir: `eas build --platform android --profile development`. EAS Google Maps billing/key tələbini aradan qaldırmır.

## Installable Android preview APK — xəritə deferred

Bu profil development server tələb etməyən, real Android cihazlara göndərilə bilən signed APK yaradır. Preview config yalnız public read-only Supabase dəyərlərini bundle edir; Google Maps key daxil etmir. Xəritə tabı native MapView mount etmək əvəzinə beta məlumatı göstərir.

1. Pulsuz Expo hesabı yaradın və aşağıdakı tək command-i `mobile` qovluğunda işlədin:
   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```
2. İlk dəfə command daxilində Expo login, EAS project link və Android keystore yaradılması təsdiqi istənə bilər. Credential EAS-də saxlanılır, repo-ya yazılmır.
3. Build bitəndə terminaldakı build URL-ni açın. Expo build səhifəsindən APK-nı yükləyin və ya URL-ni testerə göndərin; Android-də unknown-app install təsdiqi lazım ola bilər.

Free planın aylıq build kvotası daxilində bu build ödənişsizdir. Google Maps billing, Play Console və store submission bu flow-a daxil deyil.

## Expo Go incompatibility on iOS (SDK 57)

- Səbəb: iPhone-dakı Expo Go binary-si layihənin SDK 57 native runtime-ını ehtiva etmir. LAN/tunnel yalnız Metro bağlantısını dəyişir.
- Dəstəklənən alternativ: SDK 57 ilə uyğun `expo-dev-client` development build (`~57.0.18`). Paket hazırdır, lakin Windows-da onu iPhone-a quraşdırmaq üçün aşağıdakı tələblərdən biri yenə lazımdır.
- Pulsuz yol: Mac + Xcode + pulsuz Apple Account (Personal Team) ilə yalnız öz iPhone-na quraşdırmaq olar; provisioning 7 gündən sonra bitir və build yenidən quraşdırılmalıdır.
- Windows/EAS yolu: EAS cloud build Mac tələb etmir və Expo-nun Free planında məhdud, aşağı-prioritet build kvotası var. Lakin fiziki iPhone development build-i üçün aktiv Apple Developer Program üzvlüyü, cihaz qeydiyyatı və signing tələb olunur. Üzvlük illik 99 USD-dir (və ya yerli valyuta ekvivalenti).
- Bu layihə üçün EAS build, Apple credential, ödəniş və ya billing aktivləşdirilməyib.
- Ən sürətli sıfır-xərc yol: Android telefonda ən son Expo Go-nu açın, sonra `npx expo start --tunnel` işlədib QR kodu skan edin. Discovery və digər qeyri-map flow-lar yoxlana bilər; SDK 57 Android xəritəsi üçün Expo Go keçərli acceptance yolu deyil.

App açılan kimi `DEVICE_QA.md` faylındakı “İlk 15–20 dəqiqə” bölməsinə başlayın.
