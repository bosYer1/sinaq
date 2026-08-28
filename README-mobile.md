# GameYer native mobile foundation

Existing `/mobile` continues on `feat/mobile-app-foundation`; it is not a replacement app or backend. Expo SDK 57, React Native, Expo Router and the existing Supabase public API are retained. No WebView, paid service, account, booking or payment flow is introduced.

## Audit and architecture

- Production baseline: `origin/main` at `df4504e` (2026-08-28). This branch incorporates that baseline without changing remote main.
- Web public source: `src/lib/queries/clubs.ts`, `src/lib/clubType.ts`, `src/lib/utils.ts`; schema types: `src/types/database.ts`.
- Eligibility is active + nonempty Instagram + valid coordinates + assigned PC/PlayStation type. Production RLS enforces the assigned-type boundary in `app_private.is_public_club`; it is not invoked as a mobile RPC. The mobile query and normalizer apply the same public constraints defensively. `is_verified` is an optional UI filter, not a substitute for eligibility.
- Public list/detail reads use explicit fields, 15-second timeout/abort, in-flight deduplication and bounded detail caching. No mutation or admin API is exposed in the mobile UI. Public-only database types forbid insert/update payloads; RLS is still the actual authorization boundary.
- Existing discovery/filter/map/detail screens and safe external phone/Instagram/directions actions are preserved. Current profile images and tariff/schedule labels are read from real fields; no missing data is invented.
- `ThemeProvider` supplies light/dark palettes to every screen, navigation chrome, loading/error states and map cards. System is the startup default; Appearance tab overrides it for the current session. No token storage is needed. Persistence of this non-sensitive preference can be added later with AsyncStorage.
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
- Final local results: mobile lint, strict TypeScript, 38 unit tests (9 suites), Android/iOS Hermes exports, web lint, TypeScript and production build passed. Web build required explicitly supplied public Supabase env values; none were saved to tracked files.
- Expo Doctor: **20/21, FAIL** on current SDK 57 patch alignment (Expo 57.0.15 vs expected 57.0.18; React Native 0.86.2 vs 0.86.3 and related Expo patches). Dependencies were not upgraded in this scope. Resolve the compatible patch set and revalidate before release.
- Mobile CI credential scanning excludes unit-test fixtures that deliberately construct invalid JWT roles; production client source remains scanned. No real private credentials are present in those fixtures.
- Bundle export is not a native binary/device launch. Home rendering, tab transitions, live theme switching, map gestures and platform performance require physical Android/iOS QA.
- Physical-device QA remains **BLOCKED/POSTPONED and a release blocker**. No item in [mobile/DEVICE_QA.md](mobile/DEVICE_QA.md) is marked passed by this work. During the next session also test System → Light → Dark across all screens and OS appearance changes.

## Following sprint / stop boundaries

- Distance sorting and on-demand foreground location permission are not in this initial skeleton completion. Permissions remain blocked; no background location collection.
- Native contact/club-owner submission screens are deferred. Existing web submission uses a guarded Next.js server action, not a stable mobile REST contract. Do not bypass it with a direct production insert; production write integration requires founder review. No test submissions were sent.
- Native Google Maps Android release credentials, iOS signing and store distribution remain separate approval gates; no billing is enabled.
- Do not merge/release until physical-device QA and PR review pass. PR branch publication is not authorization to deploy production.
