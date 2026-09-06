# Cloudflare standby and disaster-recovery runbook

GameYer production remains on Vercel. This runbook prepares a Cloudflare Workers standby and a later, separately approved DNS architecture. Nothing in this repository change moves production traffic, changes nameservers, or attaches `gameyer.az` to Cloudflare.

## Recommended architecture

Use **Cloudflare as authoritative DNS, with the Vercel records DNS-only in normal operation**. Keep a tested Worker deployment ready on a separate noindexed hostname. During an incident, replace the Vercel origin records with Worker Custom Domains for the exact apex and `www` hostnames.

```text
Normal
visitor -> Cloudflare authoritative DNS (DNS only) -> Vercel production -> Supabase

Emergency
visitor -> Cloudflare authoritative DNS -> Worker Custom Domain -> GameYer standby -> Supabase
```

This is the lowest-coupling free design:

- Vercel remains the direct production origin in normal operation. Cloudflare is not a proxy/runtime dependency and Vercel keeps its normal traffic visibility, firewall, caching, analytics, TLS and domain verification behavior.
- After the one-time nameserver migration, an outage needs no registrar or nameserver change. Cloudflare publishes zone changes globally within five minutes in normal conditions; DNS-only records can use the Free-plan minimum TTL of 60 seconds.
- The standby uses the same Git source and public read-only Supabase access. There is no database copy or new write surface.
- Rollback restores the saved Vercel records in the same authoritative Cloudflare zone.

The 5–15 minute target is realistic after a successful rehearsal. The operational target is no more than 60 minutes. Cloudflare does not publish a hard Custom Domain certificate activation SLA, so the first canonical rehearsal is a required readiness gate rather than an assumption.

## Alternatives evaluated

| Option | Decision | Reason |
| --- | --- | --- |
| A. Cloudflare authoritative DNS, Vercel primary | Selected with DNS-only normal records | Removes nameserver propagation from an outage without putting Cloudflare in every normal request. |
| B. Cloudflare proxy/Worker permanently in front of Vercel | Rejected | Vercel does not recommend this: it reduces Vercel traffic visibility/security controls and adds TLS, Host/SNI, cache, redirect and `/.well-known` complexity. Free Origin Rules cannot provide every origin override available on Enterprise. |
| C. Cloudflare DNS-only authority with manual failover | Selected operating model | A 60-second normal TTL and already-authoritative zone make manual cutover and rollback fast and understandable. |
| D. Cloudflare Load Balancing | Rejected | This is a paid add-on requiring billing setup and is unnecessary for the manual recovery objective. |

## Runtime and compatibility

The repository uses Next.js 16.3.3, App Router, Node-runtime `proxy.ts`, SSR, route handlers, Server Actions and 60-second ISR. The standby uses vinext because the tested build supports the current Node proxy boundary.

| Area | Status | Note |
| --- | --- | --- |
| App Router, SSR, route handlers | Verified in build and preview | vinext build and live public routes pass. |
| Node.js `proxy.ts` admin guard | Verified in preview | `/admin` and `/admin/mfa` redirect to login. |
| Server Actions | Build-only | Do not submit forms against production during standby QA. |
| ISR / cache | Build and public smoke verified | Cache is enabled; no KV/R2 data cache is used. |
| `next/image` | Passthrough | Cloudflare Images is deliberately disabled. |
| Supabase public reads | Verified | Public URL and publishable key only; RLS stays the authorization boundary. |
| Analytics | Compatible | Filter standby-host QA traffic; optional browser analytics may be omitted. |

## Relevant Cloudflare Free limits

Verify these again immediately before the one-time DNS migration because platform limits can change.

| Resource | Current Free limit | GameYer evidence / risk |
| --- | --- | --- |
| Worker requests | 100,000/day | Latest repository audit recorded only tens of daily/sample pageviews, far below this cap. A campaign or bot spike can still exhaust it and produce Error 1027. |
| Worker CPU | 10 ms/request | SSR may exceed this on expensive paths. This is the most important runtime limit to observe during a rehearsal. |
| Worker memory | 128 MB | No failure observed; monitor under concurrent SSR. |
| Subrequests | 50/request | Current public pages are below this in smoke tests; watch data-fetch growth. |
| Static assets | Free and unlimited when served as static assets | Requests that invoke Worker code still count as Worker requests. |
| Worker upload | 64 MiB uncompressed | Tested upload was about 3.98 MiB uncompressed. |
| Static files | 20,000/Worker | Tested build contained 83 assets. |
| Builds | 3,000 minutes/month, one concurrent build, 20-minute build timeout | Local standby build completes in well under the timeout; do not rebuild every commit. |
| DNS | Free, no DNS-query charge/cap; 200 records for newer Free zones | Inventory the complete production zone before migration. |
| Worker routes/custom domains | 1,000 routes/zone; 100 custom domains per account | Only apex, `www`, and one standby hostname are needed. |

The latest measured traffic is safely below the request cap, but it is not live capacity telemetry. CPU time, a sudden traffic spike and Supabase availability are the realistic outage risks.

## Standby environment

Set these in Workers Builds and Worker runtime settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key only)

`CLOUDFLARE_STANDBY=1` and `NEXT_PUBLIC_SITE_URL=https://gameyer.az` are pinned in `wrangler.jsonc`; also set them as build variables. Never add `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, private database credentials, or real values to Git.

Optional browser-only analytics variables may be omitted on the standby. Local `.env*`, `.dev.vars`, `dist/`, `.vinext/` and `.wrangler/` artifacts stay untracked.

## Build and read-only readiness check

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run build:vinext
```

After starting or deploying the standby, run:

```text
DR_BASE_URL=https://standby-host.example DR_EXPECT_STANDBY=1 DR_EXPECT_ANALYTICS_WRITE=disabled npm run dr:check
```

On PowerShell:

```text
$env:DR_BASE_URL='https://standby-host.example'
$env:DR_EXPECT_STANDBY='1'
$env:DR_EXPECT_ANALYTICS_WRITE='disabled'
npm run dr:check
```

The check performs GET requests only. It requires:

- `/api/health` to confirm both database access and at least one active club readable through public RLS;
- the application home page to render;
- `/gameyer-logo.jpeg` to return a non-empty image;
- `/sitemap.xml` to expose a real public club detail route and that route to render;
- standby HTML to retain the `X-Robots-Tag: noindex` gate when `DR_EXPECT_STANDBY=1`.
- the Worker to remain unable to write analytics when `DR_EXPECT_ANALYTICS_WRITE=disabled`.

It never submits a form or writes to Supabase. A missing active club, RLS read failure, timeout or malformed response fails the check.

## One-time Founder preparation (separate approval required)

Perform this only while Vercel and the registrar are healthy, in a scheduled maintenance window:

1. Capture a read-only public baseline with `npm run dr:dns:snapshot`. Save its JSON outside Git with the incident records. This is not a complete zone export and wildcard answers can look like exact records: authenticated DNS inventory remains mandatory.
2. In Vercel, record the exact current apex and `www` values shown by `vercel domains inspect`; do not rely on generic example values.
3. Export/inventory every DNS record: apex/`www`, MX, TXT, CAA, DKIM/DMARC, verification and any subdomain. Save a dated before-state outside the repository.
4. Add the zone to the intended Cloudflare account and compare imported records line by line. Keep the Vercel web records **DNS only** (grey cloud), set their TTL to 60 seconds, and do not modify mail records.
5. Resolve DNSSEC/DS migration exactly as instructed by the registrar and Cloudflare. Do not change nameservers until the record audit passes.
6. With explicit approval, change the registrar nameservers once, then wait for Cloudflare zone activation and full propagation. Verify Vercel still serves apex and `www`, mail records resolve, redirects work and Vercel TLS remains valid.
7. Wait until Cloudflare Universal SSL is Active. Cloudflare documents a 15-minute to 24-hour provisioning window after zone activation and provisions it even for DNS-only records.
8. Deploy the noindexed Worker to the permanent Cloudflare account and a separate standby hostname. Do not use the temporary `workers.dev` account as the durable DR control plane.
9. Run with `DR_EXPECT_STANDBY=1` and `DR_EXPECT_ANALYTICS_WRITE=disabled`, then run the browser regression suite and mobile/desktop smoke tests. Record the Worker version, Git commit and timestamp.
10. Conduct a scheduled canonical failover-and-rollback rehearsal. Until this succeeds, the <=60-minute objective is **not verified**.

No production route or DNS mutation is encoded in `wrangler.jsonc`; canonical attachment remains an explicit dashboard action.

## Emergency failover

### T+0 — detect and contain

1. Confirm the incident from two independent networks and Vercel status/usage. Do not fail over for a single local DNS/browser failure.
2. Freeze production deployments. Do not remove the Vercel project or its domains.

### T+5 — prove standby health

1. Open the permanent noindexed standby URL.
2. Run `DR_BASE_URL=<standby-url> DR_EXPECT_STANDBY=1 DR_EXPECT_ANALYTICS_WRITE=disabled npm run dr:check`.
3. Stop if health, Supabase reads, the logo, or a real club detail fails. The DR system does not solve a Supabase outage.
4. Confirm the chosen Worker version matches the recorded production-compatible Git commit.

### T+10 — initiate cutover

1. Deploy or select the prebuilt canonical release with `CLOUDFLARE_STANDBY=0` and `NEXT_PUBLIC_SITE_URL=https://gameyer.az`. Verify the noindex gate is absent on its preview before routing traffic.
2. In Cloudflare DNS, save/screenshot the exact current apex and `www` Vercel records again.
3. In Worker **Settings -> Domains & Routes**, add Custom Domain `gameyer.az`. Add the exact `www.gameyer.az` hostname as well, or retain the reviewed `www` redirect rule. Cloudflare must be allowed to replace the conflicting web-origin records; do not touch MX/TXT/CAA records.
4. Wait for both Custom Domains and their certificates to show Active.

### T+15–60 — validate canonical service

1. Run `DR_BASE_URL=https://gameyer.az DR_EXPECT_ANALYTICS_WRITE=disabled npm run dr:check` with `DR_EXPECT_STANDBY` unset.
2. Verify apex/`www` redirect policy, TLS, home/list/search/filter/map, two club details, assets, 404, admin login redirects and analytics.
3. Confirm canonical production responses do **not** contain `X-Robots-Tag: noindex` and metadata points to `https://gameyer.az`.
4. Monitor Worker errors, CPU time, request quota and Supabase errors. Record start/end times and the deployed version.

During the outage: **no registrar action, nameserver change, Vercel action, GitHub action, database migration or Supabase write is required**. If a build is needed during the incident, GitHub/build availability becomes an avoidable dependency; keep a verified release predeployed.

## Rollback to Vercel

1. Confirm the preserved Vercel deployment is healthy on its Vercel deployment URL and that its production environment is intact.
2. Save the incident Worker version and logs.
3. In Cloudflare Worker Domains & Routes, remove the canonical Custom Domains. Do not remove the separate standby hostname.
4. Restore the exact saved Vercel apex and `www` records as DNS-only with 60-second TTL. Preserve all non-web records.
5. Verify apex/`www` DNS from two resolvers, TLS, `/api/health`, public pages, assets, admin redirects and analytics.
6. Run `DR_BASE_URL=https://gameyer.az npm run dr:check`. Keep monitoring for at least two previous TTL windows.
7. Return the standby build to `CLOUDFLARE_STANDBY=1` and verify noindex on its separate hostname.

Rollback uses the existing Cloudflare nameservers, so it also avoids nameserver propagation.

## Failure modes

| Failure | Does standby help? | Remaining risk/action |
| --- | --- | --- |
| Vercel outage | Yes | Manual Custom Domain cutover; Worker/Supabase must be healthy. |
| Vercel quota/project pause | Yes | Same cutover; investigate quota separately, no paid action is automatic. |
| Cloudflare outage/control-plane failure | No | Cloudflare becomes the DNS/control-plane single point after migration; direct Vercel may remain reachable only by its deployment URL. |
| Supabase outage | No | Both origins share Supabase. Public data is a deliberate single point of failure. |
| GitHub outage | Yes, if predeployed | Use the recorded Worker version. A just-in-time build is not acceptable DR preparation. |
| DNS/configuration error | Partly | Restore the saved record snapshot; Cloudflare authority is still required. |
| Bad Vercel deployment | Yes | Fail over to the last verified standby version, provided the defect is not shared application code/data. |
| Bad standby deployment | No | Roll back the Worker version or remain on Vercel. Never promote an unverified standby. |
| Worker Free limit exhaustion | No | Error 1027 may occur; rollback to Vercel or obtain separate Founder approval for capacity. |

## Drift policy

- Rebuild and smoke-test the standby after a material production release that changes routes, data queries, runtime dependencies, security headers or environment requirements.
- Run the read-only readiness check monthly without rebuilding when no material change exists.
- Rebuild and complete a rehearsal before a high-traffic campaign or planned Vercel maintenance.
- Record Git SHA, Worker version, test timestamp and known compatibility gaps in the incident log.
- Do not deploy every commit. The standby should trail only by an explicitly recorded, tested release—not by an unknown branch state.

## Hard gates

- Standby hostname: always `CLOUDFLARE_STANDBY=1`, noindex.
- Canonical emergency release: `CLOUDFLARE_STANDBY=0`; verify noindex is absent before attachment.
- Public Supabase key only; health and smoke tests are GET/read-only.
- No DNS-changing automation is included. Every canonical cutover and rollback requires an authenticated Founder action and a saved before-state.
- PR merge, Cloudflare zone activation, nameserver migration, canonical domain attachment and any paid feature each require separate Founder approval.

## Official references checked

- Cloudflare Workers [limits](https://developers.cloudflare.com/workers/platform/limits/), [pricing](https://developers.cloudflare.com/workers/platform/pricing/), [static asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) and [build limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)
- Cloudflare DNS [TTL](https://developers.cloudflare.com/dns/manage-dns-records/reference/ttl/), [FAQ](https://developers.cloudflare.com/dns/faq/) and [full zone setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/)
- Cloudflare Workers [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/) and [workers.dev guidance](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)
- Cloudflare [Universal SSL activation](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/enable-universal-ssl/) and [Load Balancing setup](https://developers.cloudflare.com/load-balancing/get-started/enable-load-balancing/)
- Vercel [Cloudflare proxy guidance](https://vercel.com/kb/guide/cloudflare-with-vercel), [proxy requirements](https://vercel.com/kb/guide/can-i-use-a-proxy-on-top-of-my-vercel-deployment) and [external DNS setup](https://vercel.com/docs/domains/set-up-custom-domain)
