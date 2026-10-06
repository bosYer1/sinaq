# GameYer Data Continuity

Status: implementation candidate on `codex/data-continuity-20261006`. No production migration or deployment is implied by this document.

## Goal

GameYer analytics must not depend on a paid/trial connector for historical continuity. Connector products may remain useful for ad-hoc analysis, but canonical collection and long-term snapshots must use provider APIs plus GameYer-owned storage.

## Provider policy

| Data | Canonical source | GameYer access path | Paid connector status | Continuity action |
| --- | --- | --- | --- | --- |
| First-party traffic/intents | Supabase | GameYer server/OIDC | none | Raw first-party rows remain primary evidence. |
| Google Search Console | Google Search Console | Official Search Console API in `gsc-server.ts` | GSC Wizard trial ended; not canonical | Daily finalized snapshots to private Supabase archive. |
| Google Analytics 4 | Google Analytics | Official GA4 Data API in `ga4-server.ts` | Supermetrics license absent; not canonical | Daily settled summary/channel snapshots. |
| PostHog | PostHog | Direct PostHog query API in `posthog-server.ts` | Free tier is usable | Daily KPI snapshots because free-plan analytics retention is 1 year. |
| Meta Ads | Meta | Direct Graph API in `meta-server.ts` | Supermetrics license absent; not canonical | Daily account/campaign snapshots while ads are used. |
| Vercel | Vercel | Vercel connector/API | not a business-analytics archive | Keep for deployment/runtime health only. |

## Current configuration finding — 2026-10-06

The direct provider adapters already exist in the repository, but the Vercel production values for the following provider credentials are empty/unconfigured:

- `GSC_SITE_URL`
- `GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL`
- `GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY`
- `GA4_PROPERTY_ID`
- `GOOGLE_ANALYTICS_CLIENT_EMAIL`
- `GOOGLE_ANALYTICS_PRIVATE_KEY`
- `POSTHOG_PERSONAL_API_KEY`
- `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`

Do not put any private credential in the public repository.

A single Google service account can be used for both GSC and GA4 by granting that service-account email read access in Search Console and the GA4 property. The archive workflow supports shared secrets named:

- `GOOGLE_PROVIDER_CLIENT_EMAIL`
- `GOOGLE_PROVIDER_PRIVATE_KEY`

Provider-specific credentials can still be used by the application adapters.

## Archive design

The scheduled workflow `.github/workflows/provider-data-archive.yml` runs once daily and defaults to three Baku calendar days behind the current day so Search Console data is settled.

It collects:

- GSC: finalized daily summary and query → page rows, chunked for safe storage.
- GA4: daily headline metrics plus channel/source-medium rows.
- PostHog: clean public daily pageviews/users, club-detail reach and outbound intent summary.
- Meta Ads: daily account summary and campaign rows.

The workflow never receives a Supabase service-role/secret key. It mints a short-lived GitHub Actions OIDC token with the audience `https://gameyer.az/provider-archive-ci`. The dedicated Edge Function validates repository ID, actor ID, workflow ref, event type and `main` ref before it can upsert archive rows.

Archive rows contain aggregates/provider report rows only. Do not store provider access tokens, private keys, email bodies, raw IPs, or user-level PII.

## Private storage candidate

`docs/analytics/provider_metric_snapshots_migration_candidate.sql` defines the proposed archive table.

Security contract:

- RLS enabled.
- `anon`: no access.
- `authenticated`: admin-only SELECT policy; no INSERT/UPDATE/DELETE.
- trusted Edge Function: service credential remains server-side in Supabase.
- unique key `(provider, snapshot_date, dataset, chunk_index)` makes reruns idempotent.
- payload size is bounded.

The candidate is deliberately not a production migration yet. During an approved schema window, create the real migration with the Supabase CLI (`supabase migration new provider_metric_snapshots`), copy/review the candidate SQL, run advisors, verify RLS, then deploy the Edge Function and workflow in the same controlled release.

## One-time credential setup

Before enabling the scheduled archive:

1. Create or recover a Google Cloud service account with Search Console API and Google Analytics Data API access.
2. Add its email as a read user to the `gameyer.az` Search Console property and the GameYer GA4 property.
3. Add the shared Google email/private key and GA4 property ID as GitHub Actions secrets.
4. Create/use a read-only PostHog personal API key for GameYer project `585472`; add it as a GitHub Actions secret.
5. If Meta Ads history is required, add a read-only/least-privilege Meta token and ad-account ID as GitHub Actions secrets.
6. Run the workflow manually for a settled historical date and compare results with the provider UIs before enabling the schedule.

## Backfill

After credentials and storage are live, backfill from the oldest available provider date forward. The workflow supports `workflow_dispatch` with `archive_date=YYYY-MM-DD`.

Priority:

1. GSC — backfill all available GameYer history.
2. GA4 — backfill all available GameYer history.
3. PostHog — backfill before the free 1-year retention boundary approaches.
4. Meta — backfill campaign periods that matter for acquisition analysis.

Never overwrite raw first-party Supabase analytics with third-party provider numbers; store them side-by-side because identity and attribution semantics differ.

## Connector rule

GSC Wizard and Supermetrics are optional analysis surfaces only. Their subscription/trial state must never determine whether GameYer can collect or retain its analytics. If a connector stops working, the official API + private archive path remains canonical.
