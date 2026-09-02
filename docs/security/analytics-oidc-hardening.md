# Analytics OIDC hardening

## Goal
Remove direct public PostgREST INSERT access to `page_views` and `analytics_events` once a trusted server-only writer is proven in production.

## Current production-safe state
The OIDC rollout attempted in PRs #243 and #245 was not proven live. The production health check after #243 reported `analytics_write=disabled`, and #245 could not be deployed because the Vercel Hobby project hit its daily deployment limit.

Until a trusted writer is verified, the application must retain the existing bounded `public-fallback` path. The database still has RLS, column-scoped INSERT grants, payload validation and rate-limit triggers. Migration `20260831183000_server_only_analytics_writes.sql` must **not** be applied while `public-fallback` is active.

## Future trusted rollout
Either of these may replace the fallback after live verification:
- a server-only `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` configured on the correct Vercel `gameyer` project; or
- a Vercel OIDC path that is explicitly enabled and verified on that project before DB revocation.

Only after a live request succeeds through the trusted writer should the server-only migration remove anon/authenticated INSERT policies and grants.

The old Vercel project `gameyerr` is not part of this rollout and must not be used.
