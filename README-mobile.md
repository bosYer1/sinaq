# GameYer native mobile foundation

Existing `/mobile` continues on `feat/mobile-app-foundation`; it is not a replacement app or backend. Expo SDK 57, React Native, Expo Router and the existing Supabase public API are retained. No WebView, paid service, account, booking or payment flow is introduced.

## Audit and architecture

- Production baseline: `origin/main` at `df4504e` (2026-08-28). This branch incorporates that baseline without changing remote main.
- Web public source: `src/lib/queries/clubs.ts`, `src/lib/clubType.ts`, `src/lib/utils.ts`; schema types: `src/types/database.ts`.
- Eligibility is active + nonempty Instagram + valid coordinates + assigned PC/PlayStation type. Production RLS enforces the assigned-type boundary in `app_private.is_public_club`; it is not invoked as a mobile RPC. The mobile query and normalizer apply the same public constraints defensively. `is_verified` is an optional UI filter, not a substitute for eligibility.
- Public list/detail reads use explicit fields, 15-second timeout/abort, in-flight deduplication and bounded detail caching. No mutation or admin API is exposed in the mobile UI. Public-only database types forbid insert/update payloads; RLS is still the actual authorization boundary.
- Existing discovery/filter/map/detail screens and safe external phone/Instagram/directions actions are preserved. Current profile images and tariff/schedule labels are read from real fields; no missing data is invented.
- `ThemeProvider` supplies light/dark palettes to screens and navigation. System is the default; More → Appearance overrides it for this session. Bottom tabs are Discovery, Map, Nearby, More. Theme is no longer a top-level tab.
- Color tokens follow `src/app/globals.css`, including the production dark surfaces and purple. Native font sizes/spacing remain adapted to phones; muted text is slightly brighter where needed.
- All four mobile PNG assets are resizes of the original `public/gameyer-logo.jpeg` brought in from production main. No generated/redrawn logo. Missing club images show a text state, not an invented logo.
- Mobile dependencies/install remain isolated. The existing root ESLint and TypeScript exclusions for `mobile` prevent the web build from compiling React Native. Root package/deploy configuration is not changed by this work.

## Start

From the repository root:

```powershell
cd mobile
npm ci
npx expo start --tunnel --clear
```

Configure only these public values in ignored `mobile/.env.local` using the chosen Supabase project's public configuration:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never commit this file or use a secret/service-role key. `config.ts` uses direct Expo-supported env references so Metro can inject them. Missing config fails closed; there is no production fallback. Local QA configuration is not included in the PR.

See [mobile/DEVICE_START.md](mobile/DEVICE_START.md) for QR/LAN/tunnel and SDK 57 iPhone limitations. Windows cannot produce/install a custom iPhone build without the documented Apple tooling/account path. No signing credentials or paid resources have been created.

## Verification and acceptance

```powershell
# mobile directory
npm run lint
npm run typecheck
npm test
npx expo-doctor
npm run build:android
npm run build:ios
# repository root
npm run lint
npx tsc --noEmit
npm run build
```

- A read-only public production check on 2026-08-28 returned 33 eligible clubs and successfully read detail/profile/tariff fields. This is a point-in-time result, not a fixed count.
- Automated regression coverage includes public eligibility, premium expiry, filter compatibility, theme resolution and Expo's actual env discovery transform.
- Beta sprint local results (2026-08-29): clean mobile install, lint, strict TypeScript, 66 unit tests (16 suites), Doctor 21/21, compatibility check, Android/iOS Hermes exports, web lint, TypeScript and production build passed. Web build required explicitly supplied public Supabase env values; none were saved to tracked files. Existing 12 moderate npm audit advisories remain; no breaking audit fix was applied.
- SDK 57 patch alignment was resolved in `a18accb` (Expo 57.0.18 / RN 0.86.3, Doctor 21/21). The beta sprint adds only the Expo-managed `expo-location` package.
- Mobile CI credential scanning excludes unit-test fixtures that deliberately construct invalid JWT roles; production client source remains scanned. No real private credentials are present in those fixtures.
- Bundle export is not a native binary/device launch. Home rendering, tab transitions, live theme switching, map gestures and platform performance require physical Android/iOS QA.
- Founder reports Android launch, public reads, Discovery, theme and tabs PASS on the preceding build. New beta changes require device revalidation. **KNOWN BLOCKER — Android physical device map rendering unresolved.** iOS QA remains BLOCKED/POSTPONED. See [mobile/DEVICE_QA.md](mobile/DEVICE_QA.md).

## Following sprint / stop boundaries

- Nearby is independent of Map. Only an explicit button requests foreground permission. One balanced-accuracy fix is bounded to 15 seconds after permission/services checks; the watcher is removed on success/error/abort. Coordinates live only in screen state, cleared on blur/background, never persisted, logged or sent to Supabase/analytics. Haversine sorting uses public club coordinates; distances are approximate straight-line km. Android background/foreground-service location and iOS Always/Motion access are disabled.
- More includes native informational contact, owner, about and privacy pages plus app version. Owner submission remains informational only; no form, direct insert or test submission. External actions use a restricted URL allowlist and report unsupported handlers safely.
- Native Google Maps Android release credentials, iOS signing and store distribution remain separate approval gates; no billing is enabled.
- Android Expo Go is not a valid map acceptance environment: Expo removed Google Maps support from Android Expo Go starting with SDK 53. SDK 57 keeps `react-native-maps 1.27.2`, while `expo-dev-client ~57.0.16`, dynamic restricted-key injection and development/preview/production EAS profiles prepare the native build path without creating an account, credential or paid resource.
- Android production EAS jobs fail closed when `GOOGLE_MAPS_API_KEY_ANDROID` is absent. The value is build-time native configuration, remains outside git, and must be restricted to `az.gameyer.app` plus the correct signing SHA-1.
- Release metadata, Data Safety notes, graphics requirements and closed-testing gates are tracked in [mobile/PLAY_STORE_RELEASE.md](mobile/PLAY_STORE_RELEASE.md). App Store/Play submission is not performed by this branch.
- Do not merge/release until physical-device QA and PR review pass. PR branch publication is not authorization to deploy production.
