# GameYer-i real cihazda aç

1. Kompüterdə Node.js 24 və npm, telefonda isə ən son Expo Go quraşdırılmış olmalıdır. Kompüter və telefon eyni Wi-Fi şəbəkəsində olsun.
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
6. iPhone: Camera ilə QR kodu skan edib Expo Go-da açın. Mac/Xcode tələb olunmur.
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

App açılan kimi `DEVICE_QA.md` faylındakı “İlk 15–20 dəqiqə” bölməsinə başlayın.
