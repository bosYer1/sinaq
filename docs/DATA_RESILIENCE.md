# GameYer data resilience — 2026-10-06

## Goal

Keep analytics and conversion telemetry available when a third-party trial, connector, or reporting subscription ends. Paid connectors must not be the only path to any critical GameYer dataset.

## Provider map

| Signal | Source of truth | Paid/trial connector status | Durable GameYer path |
| --- | --- | --- | --- |
| First-party page views / intent | Supabase | No connector required | Existing trusted OIDC ingest remains canonical |
| Product analytics | PostHog project 585472 | Connector scopes may vary | Existing PostHog SDK capture + server read adapter |
| GA4 | Google Analytics | Supermetrics trial ended; Windsor currently trial | Existing direct GA4 Data API adapter once Google server credentials are configured |
| Google Search Console | Google Search Console | GSC Wizard unavailable after trial; Supermetrics trial ended; Windsor currently trial | Existing direct Search Console API adapter once Google server credentials are configured |
| Meta browser events | Meta Pixel | No vendor required | Existing first-party Pixel integration |
| Meta server events | Meta Conversions API | Datahash CAPI trial expired 2026-09-25 | Direct GameYer CAPI route in this branch |
| Hosting/runtime | Vercel Hobby | Usage limits can interrupt deployment/runtime capacity | Not an analytics source of truth; keep durable data outside Vercel |

## Direct Meta CAPI replacement

This branch removes Datahash from the critical event-delivery path by adding a direct server route:

- Browser Pixel and server CAPI share the same event name + event ID for deduplication.
- Event names are strictly allowlisted.
- Custom fields are strictly allowlisted.
- No email, phone number, name, or client IP is collected by the new CAPI helper.
- `_fbp` / `_fbc` are forwarded only when Meta has already created those cookies.
- The access token is server-only.
- CAPI is compile-time gated by `NEXT_PUBLIC_META_CAPI_ENABLED=1`; default is OFF so there is no extra Vercel request load before credentials are ready.
- Graph API default is pinned to v26.0 and can be overridden with a validated server env.

Required activation envs:

```text
NEXT_PUBLIC_META_CAPI_ENABLED=1
META_CAPI_ACCESS_TOKEN=<server-only Meta CAPI token>
META_CAPI_PIXEL_ID=<optional; otherwise NEXT_PUBLIC_META_PIXEL_ID is reused>
META_GRAPH_API_VERSION=v26.0
```

Never commit the token to GitHub.

## Google read-path resilience

The repo already contains direct server adapters for GA4 and Search Console. They do not depend on GSC Wizard, Supermetrics, or Windsor.

Permanent Google adapter envs:

```text
GA4_PROPERTY_ID=
GOOGLE_ANALYTICS_CLIENT_EMAIL=
GOOGLE_ANALYTICS_PRIVATE_KEY=

GSC_SITE_URL=https://gameyer.az/
GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL=
GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY=
```

Until those server credentials are configured, Windsor may be used only as a temporary read fallback. It is not a source of truth and must not become a new critical dependency.

## What is deliberately not done in this branch

- No production deployment.
- No production database DDL or data mutation.
- No provider secret written to Git.
- No weakening of Supabase RLS or public grants.
- No attempt to copy marketing data into the existing `analytics_events` table; its schema is intentionally limited to first-party product events.
- No scheduled archive table is added without a separately reviewed private-schema migration.

## Next activation gates

1. Authorize Search Console in the chosen temporary fallback if live GSC access is needed immediately.
2. Configure the direct Google server credentials so GA4/GSC reads no longer depend on third-party connector plans.
3. Generate a Meta Conversions API token in Meta Events Manager, set the server env, then enable the CAPI flag.
4. Verify browser/server deduplication in Meta Test Events before treating the direct CAPI route as production-ready.
5. Separately approve a private daily provider-snapshot store if retention beyond upstream provider windows is required.