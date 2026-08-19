# GameYer

GameYer Azərbaycanda PC və PlayStation gaming klublarını tapmaq üçün xəritə və kataloq platformasıdır.

## Production

Canonical domain after registrar/DNS activation: `https://gameyer.az`

Current legacy Vercel production alias: `https://gameyerr-gameyer.vercel.app`

The legacy alias is retained for migration/compatibility and is configured to redirect to the canonical domain only after the domain-readiness change is merged at cutover.

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
