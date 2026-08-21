# gameyer.az production cutover runbook

This runbook is intentionally prepared before domain activation. Do not merge the domain-readiness PR until the registrar shows `gameyer.az` as active and Vercel can verify the DNS configuration.

## Preconditions

- `gameyer.az` registration is active.
- DNS management is available at the registrar/DNS provider.
- Current production deployment is healthy before cutover.
- PR #87 is green in CI and Vercel preview.
- No domain DNS record is guessed; only records shown by Vercel/registrar are used.

## DNS and Vercel

1. Add `gameyer.az` to the existing GameYer Vercel project.
2. Add `www.gameyer.az` and canonicalize it to the apex domain.
3. Copy the exact DNS records supplied by Vercel into the DNS provider.
4. Wait until Vercel reports the domain as configured and the TLS certificate is valid.
5. Keep both known legacy Vercel aliases attached during migration so old links can redirect: `gameyerr-gameyer.vercel.app` and `bosyer-web.vercel.app`.

## Application cutover

1. Confirm canonical URL generation resolves to `https://gameyer.az` even if a stale legacy `NEXT_PUBLIC_SITE_URL` is still present.
2. Confirm both known legacy Vercel hosts permanently redirect to the equivalent `https://gameyer.az/...` path.
3. Confirm `www.gameyer.az` permanently redirects to the equivalent apex path.
4. Confirm `robots.txt` advertises `https://gameyer.az/sitemap.xml`.
5. Confirm every `<loc>` in `sitemap.xml` uses `https://gameyer.az`.
6. Confirm homepage, club pages, district pages and high-intent category pages each emit exactly one canonical URL on `gameyer.az`.
7. Confirm the nearby-intent landing `/yaxinliqda-gaming-klublari` is canonical, indexable only when active clubs exist, and present in sitemap when eligible.
8. Confirm Organization/WebSite/ItemList/FAQ structured data use `gameyer.az` URLs.
9. Confirm Open Graph and Twitter image URLs use the canonical domain.
10. Confirm admin routes remain noindex and API routes remain disallowed in robots.
11. Do not reuse a stale URL-prefix Search Console verification token. The planned `gameyer.az` Domain Property is verified with Google's DNS TXT record; a meta verification tag is emitted only if `GOOGLE_SITE_VERIFICATION` is explicitly configured.

## Automated production acceptance

After DNS, TLS and the production cutover are live, run:

```bash
node scripts/domain-cutover-smoke.mjs
```

The script fails the cutover if it detects a broken apex route, an unhealthy `/api/health`, a non-canonical sitemap/robots URL, a wrong/missing canonical, a legacy host leak, a missing permanent redirect from `www` or either known Vercel production alias, an indexable admin login, or missing baseline security headers.

Optional origin overrides are available through `CUTOVER_CANONICAL_ORIGIN`, `CUTOVER_WWW_ORIGIN`, `CUTOVER_LEGACY_ORIGIN`, and comma-separated `CUTOVER_LEGACY_ORIGINS` for controlled testing.

## Production acceptance checks

- `/` returns 200.
- `/api/health` returns healthy without exposing internal diagnostics.
- `/robots.txt` returns 200 and the canonical sitemap URL.
- `/sitemap.xml` returns 200 and contains only public, active, mapped clubs and eligible SEO landings.
- Representative `/klub/<slug>` pages return 200.
- Representative `/rayon/<slug>` pages return 200.
- `/yaxinliqda-gaming-klublari`, PC, PlayStation, internet, price and 24-hour category pages return 200 when eligible.
- Mobile and desktop smoke tests pass.
- No new Vercel runtime error clusters appear after cutover.
- Analytics continues recording public traffic while excluding authenticated admin traffic.
- `www` and both legacy Vercel URLs preserve their path and redirect permanently to the canonical domain.

The acceptance run should be repeated after any routing, canonical, sitemap or high-intent landing change before production cutover.

## Google Search Console

After DNS/TLS and application cutover are confirmed:

1. Add `gameyer.az` as a Domain Property.
2. Use the DNS TXT value supplied by Google for verification.
3. Submit `https://gameyer.az/sitemap.xml`.
4. Inspect the homepage and representative club/category URLs, including `/yaxinliqda-gaming-klublari`.
5. Do not submit either legacy Vercel alias as the canonical property.

## Rollback

If DNS or production validation fails, do not delete data or change Supabase. Keep/restore the last healthy Vercel production deployment and correct DNS/domain configuration before retrying. The domain migration is URL/routing/SEO work; club data remains independent in Supabase.
