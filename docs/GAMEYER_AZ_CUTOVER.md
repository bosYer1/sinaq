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
2. Add `www.gameyer.az` if desired and configure it to redirect to the apex canonical domain.
3. Copy the exact DNS records supplied by Vercel into the DNS provider.
4. Wait until Vercel reports the domain as configured and the TLS certificate is valid.
5. Keep the legacy Vercel production alias attached during migration so old links can redirect.

## Application cutover

1. Confirm canonical URL generation resolves to `https://gameyer.az` even if a stale legacy `NEXT_PUBLIC_SITE_URL` is still present.
2. Confirm the legacy host `gameyerr-gameyer.vercel.app` permanently redirects to the equivalent `https://gameyer.az/...` path.
3. Confirm `robots.txt` advertises `https://gameyer.az/sitemap.xml`.
4. Confirm every `<loc>` in `sitemap.xml` uses `https://gameyer.az`.
5. Confirm homepage, club pages, district pages and category pages each emit exactly one canonical URL on `gameyer.az`.
6. Confirm Organization/WebSite/ItemList structured data use `gameyer.az` URLs.
7. Confirm Open Graph and Twitter image URLs use the canonical domain.
8. Confirm admin routes remain noindex and API routes remain disallowed in robots.

## Production acceptance checks

- `/` returns 200.
- `/api/health` returns healthy without exposing internal diagnostics.
- `/robots.txt` returns 200 and the canonical sitemap URL.
- `/sitemap.xml` returns 200 and contains only public, active, mapped clubs.
- Representative `/klub/<slug>` pages return 200.
- Representative `/rayon/<slug>` pages return 200.
- PC, PlayStation and 24-hour category pages return 200.
- Mobile and desktop smoke tests pass.
- No new Vercel runtime error clusters appear after cutover.
- Analytics continues recording public traffic while excluding authenticated admin traffic.
- Legacy Vercel URLs preserve their path and redirect permanently to the canonical domain.

## Google Search Console

After DNS/TLS and application cutover are confirmed:

1. Add `gameyer.az` as a Domain Property.
2. Use the DNS TXT value supplied by Google for verification.
3. Submit `https://gameyer.az/sitemap.xml`.
4. Inspect the homepage and representative club/category URLs.
5. Do not submit the legacy Vercel alias as the canonical property.

## Rollback

If DNS or production validation fails, do not delete data or change Supabase. Keep/restore the last healthy Vercel production deployment and correct DNS/domain configuration before retrying. The domain migration is URL/routing/SEO work; club data remains independent in Supabase.
