# Analytics OIDC hardening

## Goal
Remove direct public PostgREST INSERT access to `page_views` and `analytics_events` without requiring a static Supabase server credential in Vercel.

## Trust path
1. Browser submits only to same-origin Next.js analytics routes.
2. Vercel production runtime supplies its short-lived `VERCEL_OIDC_TOKEN` server-side.
3. Next.js forwards the normalized analytics row and OIDC token to the Supabase Edge Function `gameyer-analytics-ingest`.
4. The Edge Function verifies Vercel issuer, audience and exact production subject before using its hosted Supabase server credential.
5. After live verification, migration `20260831183000_server_only_analytics_writes.sql` removes anon/authenticated INSERT policies and grants.

## Locked identity
- issuer: `https://oidc.vercel.com/gameyer`
- audience: `https://vercel.com/gameyer`
- subject: `owner:gameyer:project:gameyer:environment:production`

The old Vercel project `gameyerr` is not part of this trust path.
