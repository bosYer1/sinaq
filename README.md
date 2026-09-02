# GameYer

GameYer Azərbaycanda PC və PlayStation gaming klublarını tapmaq üçün xəritə və kataloq platformasıdır.

## Production

- Canonical production domain: `https://gameyer.az`
- GitHub repository: `bosYer1/sinaq`
- Production branch: `main`
- Correct Vercel project: **`gameyer`**
- Legacy project **`gameyerr` must never be used for deploys, redeploys, environment changes, or production validation.**

If a Vercel connector/session exposes only `gameyerr`, stop Vercel mutations and rely on the repository deployment integration until the correct `gameyer` project is explicitly available.

Cutover runbook: `docs/GAMEYER_AZ_CUTOVER.md`

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Leaflet / OpenStreetMap
- Supabase / PostgreSQL
- Vercel

## Data rule

Public club discovery only exposes records where the club is active and both latitude and longitude are present. Missing or unverified club data must not be invented.

## Founder analytics — clean traffic contract

Founder traffic must use a single clean public scope across pageviews, users, sessions, top pages, referrers and conversion insights:

- host is `gameyer.az`;
- `/admin` and `/api` are excluded;
- the known Cloud Browser validation visitor `01a053ae-c894-77db-80bc-889fba23279a` is excluded;
- PostHog virtual traffic must be `Regular` when that property is available, excluding Bot, AI Agent and Automation traffic;
- browser validation traffic carrying `?__analytics_smoke=1` is tagged `gameyer_analytics_test=true` and must be excluded from founder metrics;
- public custom events carry `gameyer_traffic_scope=public`;
- session recording stays disabled and analytics events must not include form contents, phone values, email values, stack traces or error messages.

`Production Analytics Smoke` uses a real headless browser against `gameyer.az`, but its tagged traffic is intentionally synthetic and must never be reported as a real visitor.
