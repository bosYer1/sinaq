# gameyer.az production cutover runbook

This runbook documents the canonical-domain acceptance checks for GameYer. Production merge/deploy remains a separate explicit action.

## Preconditions

- `gameyer.az` registration is active.
- DNS management is available at the registrar/DNS provider.
- Current production deployment is healthy before cutover.
- The SEO/domain branch is green in CI and preview checks.
- No DNS record is guessed; only records shown by Vercel/registrar are used.

## DNS and Vercel

1. Keep `gameyer.az` attached to the intended GameYer Vercel project.
2. Keep `www.gameyer.az` attached only for redirect/canonicalization to the apex domain.
3. Use the exact DNS records supplied by Vercel.
4. Confirm Vercel reports the domain as configured and TLS is valid.
5. Keep known legacy Vercel aliases reachable long enough to return permanent redirects so old links consolidate into the canonical domain.

## Application cutover

1. Confirm canonical URL generation always resolves to `https://gameyer.az`, even if a stale legacy `NEXT_PUBLIC_SITE_URL` is present.
2. Confirm all known legacy hosts, including `gameyerr-gameyer.vercel.app` and `bosyer-web.vercel.app`, permanently redirect to the equivalent `https://gameyer.az/...` path.
3. Confirm `www.gameyer.az` permanently redirects to the equivalent apex path.
4. Confirm `robots.txt` advertises `https://gameyer.az/sitemap.xml`.
5. Confirm every `<loc>` in `sitemap.xml` uses `https://gameyer.az`.
6. Confirm homepage, club pages, district pages and indexable category pages emit exactly one canonical URL on `gameyer.az`.
7. Confirm Organization, WebSite, ItemList and LocalBusiness structured data use canonical `gameyer.az` URLs.
8. Confirm Open Graph and Twitter URLs/images resolve against the canonical domain.
9. Confirm admin routes remain noindex and API routes remain disallowed in robots.
10. Confirm empty/thin high-intent category pages remain `noindex,follow` and are omitted from the sitemap until qualifying data exists.
11. Do not reuse a stale URL-prefix Search Console verification token. A `gameyer.az` Domain Property should be verified with Google's DNS TXT record; a meta verification tag is emitted only if `GOOGLE_SITE_VERIFICATION` is explicitly configured.

## Automated production acceptance

After DNS, TLS and the intended production cutover are live, run:

```bash
node scripts/domain-cutover-smoke.mjs
```

The script fails the cutover if it detects a broken apex route, unhealthy `/api/health`, non-canonical sitemap/robots URL, wrong or missing canonical, legacy host leakage, missing permanent redirects from `www` or known Vercel aliases, an indexable admin login, or missing baseline security headers.

Optional origin overrides are available through `CUTOVER_CANONICAL_ORIGIN`, `CUTOVER_WWW_ORIGIN`, legacy-compatible `CUTOVER_LEGACY_ORIGIN`, and comma-separated `CUTOVER_LEGACY_ORIGINS`.

## Production acceptance checks

- `/` returns 200.
- `/api/health` returns healthy without exposing internal diagnostics.
- `/robots.txt` returns 200 and the canonical sitemap URL.
- `/sitemap.xml` returns 200 and contains only canonical, public, qualifying URLs.
- Representative `/klub/<slug>` pages return 200.
- Representative `/rayon/<slug>` pages return 200.
- PC, PlayStation, internet-club, price and 24-hour category pages behave according to their data/indexability rules.
- Mobile and desktop smoke tests pass.
- No new Vercel runtime error clusters appear after cutover.
- Analytics continues recording public traffic while excluding authenticated admin traffic.
- `www` and every known legacy Vercel URL preserve path/query and redirect permanently to the canonical domain.

## Google Search Console

After DNS/TLS and application cutover are confirmed:

1. Add `gameyer.az` as a Domain Property.
2. Use the DNS TXT value supplied by Google for verification.
3. Submit `https://gameyer.az/sitemap.xml`.
4. Inspect the homepage and representative club, district and category URLs.
5. Inspect canonical selection after Google recrawls old Vercel aliases.
6. Do not submit legacy Vercel aliases as canonical properties.

## Rollback

If DNS or production validation fails, do not delete data or modify Supabase to solve a routing problem. Keep or restore the last healthy Vercel production deployment and correct DNS/domain configuration before retrying. Domain migration is routing/SEO work; club data remains independent in Supabase.
