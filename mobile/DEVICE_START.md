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
10. `.env.local` faylını heç vaxt commit və ya paylaşmayın. Expo Go testi Google Maps billing və store credential yaratmır.

## Expo Go incompatibility on iOS (SDK 57)

- Səbəb: iPhone-dakı Expo Go binary-si layihənin SDK 57 native runtime-ını ehtiva etmir. LAN/tunnel yalnız Metro bağlantısını dəyişir.
- Dəstəklənən alternativ: SDK 57 ilə uyğun `expo-dev-client` development build (`~57.0.10`). Hazırda əlavə edilməyib, çünki Windows-da onu iPhone-a quraşdırmaq üçün aşağıdakı tələblərdən biri yenə lazımdır.
- Pulsuz yol: Mac + Xcode + pulsuz Apple Account (Personal Team) ilə yalnız öz iPhone-na quraşdırmaq olar; provisioning 7 gündən sonra bitir və build yenidən quraşdırılmalıdır.
- Windows/EAS yolu: EAS cloud build Mac tələb etmir və Expo-nun Free planında məhdud, aşağı-prioritet build kvotası var. Lakin fiziki iPhone development build-i üçün aktiv Apple Developer Program üzvlüyü, cihaz qeydiyyatı və signing tələb olunur. Üzvlük illik 99 USD-dir (və ya yerli valyuta ekvivalenti).
- Bu layihə üçün EAS build, Apple credential, ödəniş və ya billing aktivləşdirilməyib.
- Ən sürətli sıfır-xərc yol: Android telefonda ən son Expo Go-nu açın, sonra `npx expo start --tunnel` işlədib QR kodu skan edin. Expo Go daxilindəki xəritə Google Maps billing/key tələb etmir.

App açılan kimi `DEVICE_QA.md` faylındakı “İlk 15–20 dəqiqə” bölməsinə başlayın.
