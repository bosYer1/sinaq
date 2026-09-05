# Cloudflare standby runbook

GameYer production remains on Vercel. This branch prepares a separate Cloudflare Workers standby only; it does not change DNS or production traffic.

## Chosen runtime

The repository uses Next.js 16.3.3, App Router, Node-runtime `proxy.ts`, SSR, route handlers, Server Actions and 60-second ISR. OpenNext cannot currently run the Node.js Proxy used by the admin MFA boundary. The standby therefore uses Cloudflare's recommended Next.js 16 path, vinext, without Cloudflare Images, KV, R2 or other paid add-ons.

| Area | Status | Note |
| --- | --- | --- |
| App Router, SSR, route handlers | Compatible | vinext build succeeds. |
| Node.js `proxy.ts` admin guard | Compatible with vinext | This is the reason OpenNext was rejected. |
| Server Actions | Needs live verification | Build succeeds; never test against real data by submitting forms. |
| ISR / `unstable_cache` | Needs live verification | Workers Cache is configured; no KV/R2 data cache is enabled. |
| `next/image` | Compatible with reduced optimization | Standby serves allowed originals; Cloudflare Images is intentionally disabled. |
| Supabase public reads | Compatible | Uses the same public URL and publishable key; RLS remains the authorization boundary. |
| Admin writes and image submissions | Intentionally limited in standby preview | Do not add a service-role secret for preview QA. |
| PostHog | Compatible | Existing browser SDK remains unchanged; filter QA traffic by the standby hostname. |

## Required Cloudflare variables

Set these in Workers Builds and Worker runtime settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key only)

The safe non-secret runtime defaults `CLOUDFLARE_STANDBY=1` and `NEXT_PUBLIC_SITE_URL=https://gameyer.az` are pinned in `wrangler.jsonc`. Also set both as Workers Build variables because Next.js reads them while building metadata and headers. Do not change `CLOUDFLARE_STANDBY` to `0` until an explicitly approved canonical-domain cutover.

Optional browser analytics variables, only when their standby traffic is acceptable:

- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

Do not put values in Git or `wrangler.jsonc`. Do not add `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to the standby preview. Local `.env*`, `.dev.vars`, `dist/`, `.vinext/` and `.wrangler/` artifacts remain untracked.

## Build and local Worker smoke test

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run build:vinext
npm run start:vinext
```

With `CLOUDFLARE_STANDBY=1`, verify every HTML response includes:

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

Also verify the generated page metadata contains `noindex`, while `robots.txt` permits crawling so crawlers can observe the noindex response. The sitemap and canonical URLs must continue pointing to `https://gameyer.az`.

Read-only smoke paths:

- `/`
- `/bakida-pc-klublari`
- `/bakida-playstation-klublari`
- `/rayon`
- at least two real `/klub/<slug>` URLs discovered from `/sitemap.xml`
- `/klub-sahibi` (render only; do not submit)
- `/admin` and `/admin/mfa` (must redirect to `/admin/login`)
- `/this-route-must-not-exist` (must return 404)

Check list/map switching, search/filter controls, Leaflet/OpenStreetMap tiles, 0-image and 1–5-image clubs, phone/Instagram/directions links, PostHog bootstrap, and mobile/desktop layouts. Do not mutate Supabase data during standby QA.

## First Cloudflare deployment

Founder action is required once:

1. Sign in to the intended Cloudflare account with Wrangler.
2. In Workers settings, add the Supabase public variables to both build and runtime environments, and add the two pinned non-secret values to the build environment.
3. Run `npm run deploy:vinext` from this branch.
4. Record the resulting `https://gameyer-standby.<account-subdomain>.workers.dev` URL.
5. Run the read-only smoke list and confirm noindex before sharing the URL.

Do not attach `gameyer.az`, change nameservers, or add a production route during this step.

## Emergency failover and rollback

Current DNS authority is Vercel (`ns1.vercel-dns.com` / `ns2.vercel-dns.com`). Therefore a `workers.dev` standby is immediately usable as an alternate URL, but moving `gameyer.az` itself cannot be instant until Cloudflare is authoritative for the zone.

Founder-approved emergency cutover:

1. Confirm the standby health endpoint, public routes, Supabase reads, assets, map and noindex state are healthy.
2. Add `gameyer.az` to the Cloudflare account and copy every current DNS record, especially MX/TXT verification records.
3. In the Worker, add Custom Domains for `gameyer.az` and `www.gameyer.az`; do not use a Worker Route because the Worker is the origin.
4. In a separately reviewed cutover change, set the `wrangler.jsonc` `CLOUDFLARE_STANDBY` value to `0`, keep `NEXT_PUBLIC_SITE_URL=https://gameyer.az`, rebuild and verify that noindex is absent from the cutover version.
5. At the registrar, replace the Vercel nameservers with the exact Cloudflare nameservers assigned to the zone.
6. Monitor DNS propagation, TLS, `/api/health`, public pages, admin redirects and analytics. Keep the Vercel project unchanged for rollback.

Rollback to Vercel:

1. Confirm the Vercel deployment is healthy and still owns the expected production domains/configuration.
2. At the registrar, restore `ns1.vercel-dns.com` and `ns2.vercel-dns.com`.
3. Monitor DNS propagation and verify `gameyer.az`, `www`, TLS, health, public reads and admin redirects.
4. Remove the Cloudflare production Custom Domains only after Vercel DNS is serving consistently; keep the noindexed `workers.dev` standby.

With the current Vercel nameservers, estimated recovery for the canonical domain is DNS-limited and may take hours, with a conservative 24–48 hour propagation window. The standby `workers.dev` URL can be shared as soon as its health check passes. A later, separately approved DNS architecture change is required for minute-level automatic failover.

## Risks

- DNS cutover can cause split traffic or downtime while nameserver changes propagate.
- Missing DNS records during zone import can interrupt mail or verification services.
- Configuring a server secret on standby would create a second privileged write surface; it is deliberately omitted.
- Testing the shared PostHog project on the standby hostname can add QA traffic; filter reports by hostname.
- Enabling Meta Pixel or GA on both hosts adds standby QA events to the same analytics properties.
- Leaving `CLOUDFLARE_STANDBY=1` during canonical cutover keeps the live site noindexed; clearing it is a hard cutover gate.
- Clearing it on a public backup hostname can create SEO duplication; keep it enabled until the hostname is canonical.
